from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..db.database import get_db
from ..models import sql_models as models
from .auth import get_current_user

router = APIRouter()

# --- Auto-Migration for Schema Updates ---
# This ensures that if the code is deployed to a container with an old DB, it updates itself.
from ..db.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        # Check and add signer_name
        try:
            conn.execute(text("ALTER TABLE document_logs ADD COLUMN signer_name TEXT"))
            conn.commit()
        except Exception:
            pass # Column likely exists or other error (ignored to prevent crash)

        # Check and add signature_image
        try:
            conn.execute(text("ALTER TABLE document_logs ADD COLUMN signature_image TEXT"))
            conn.commit()
        except Exception:
            pass # Column likely exists
except Exception as e:
    print(f"Auto-migration warning: {e}")


# --- Schemas ---

class DocumentCreate(BaseModel):
    title: str
    ref_number: Optional[str] = None
    description: Optional[str] = None
    current_holder: str
    project_id: Optional[int] = None

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    ref_number: Optional[str] = None
    project_id: Optional[int] = None
    current_holder: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    signed_at: Optional[datetime] = None
    signer_name: Optional[str] = None
    signature_image: Optional[str] = None
    is_correction: Optional[bool] = False

class DocumentLogResponse(BaseModel):
    id: int
    from_holder: Optional[str]
    to_holder: str
    status: str
    note: Optional[str]
    timestamp: datetime
    signed_at: Optional[datetime] = None
    signer_name: Optional[str] = None
    signature_image: Optional[str] = None
    
    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: int
    title: str
    ref_number: Optional[str]
    description: Optional[str]
    current_holder: str
    status: str
    project_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    logs: List[DocumentLogResponse] = []
    
    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    project_id: Optional[int] = None,
    holder: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.DocumentTracker)
    if project_id:
        query = query.filter(models.DocumentTracker.project_id == project_id)
    if holder:
        query = query.filter(models.DocumentTracker.current_holder == holder)
    return query.order_by(models.DocumentTracker.updated_at.desc()).all()

@router.post("/", response_model=DocumentResponse)
async def create_document(
    doc: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.HOD]:
        raise HTTPException(status_code=403, detail="Only Admins or HODs can create document trackers")
        
    doc_data = doc.dict()
    if not doc_data.get("ref_number"):
        doc_data["ref_number"] = None
        
    db_doc = models.DocumentTracker(**doc_data)
    # Explicitly set status if not provided (should be handled by default, but being safe)
    if not db_doc.status:
        db_doc.status = "pending"
        
    db.add(db_doc)
    try:
        db.commit()
        db.refresh(db_doc)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")
    
    # Create first log entry
    first_log = models.DocumentLog(
        document_id=db_doc.id,
        from_holder=None,
        to_holder=db_doc.current_holder,
        status=db_doc.status,
        note="Physical tracking started."
    )
    db.add(first_log)
    try:
        db.commit()
        db.refresh(db_doc)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Log creation error: {str(e)}")
    
    return db_doc

@router.put("/{doc_id}", response_model=DocumentResponse)
async def update_document(
    doc_id: int,
    doc_update: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_doc = db.query(models.DocumentTracker).filter(models.DocumentTracker.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    old_holder = db_doc.current_holder
    old_status = db_doc.status
    
    update_data = doc_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_doc, key, value)
        
    # --- Advanced Logging Logic (Sequential Tracking) ---
    
    # Get the latest log entry for this document
    latest_log = db.query(models.DocumentLog).filter(
        models.DocumentLog.document_id == doc_id
    ).order_by(models.DocumentLog.id.desc()).first()

    if old_holder == db_doc.current_holder:
        # UPDATING CURRENT HOLDER (Sign or Note update)
        if latest_log:
            if db_doc.status in ["signed", "completed"] and not latest_log.signed_at:
                latest_log.signed_at = datetime.now()
            
            latest_log.status = db_doc.status
            if doc_update.description:
                latest_log.note = doc_update.description
            
            # Update signature info if provided
            if doc_update.signer_name:
                latest_log.signer_name = doc_update.signer_name
            if doc_update.signature_image:
                latest_log.signature_image = doc_update.signature_image
                if not latest_log.signed_at:
                    latest_log.signed_at = datetime.now()
    else:
        # TRANSFERRING TO NEW HOLDER (Handoff or Reroute)
        if doc_update.is_correction and latest_log:
            # REROUTE: Update the current slot in history instead of creating new one
            latest_log.to_holder = db_doc.current_holder
            latest_log.status = db_doc.status
            if doc_update.description:
                latest_log.note = doc_update.description
            elif latest_log.note and (latest_log.note.startswith("Transferred to") or latest_log.note == ""):
                latest_log.note = f"Transferred to {db_doc.current_holder}"
        else:
            # NORMAL TRANSFER: Close previous person and create new record
            if latest_log:
                # Auto-mark the previous person as "Signed" if they haven't already
                if not latest_log.signed_at:
                    latest_log.signed_at = datetime.now()
                latest_log.status = "signed"

            # Create new log for the next person
            new_log = models.DocumentLog(
                document_id=db_doc.id,
                from_holder=latest_log.to_holder if latest_log else None,
                to_holder=db_doc.current_holder,
                status=db_doc.status,
                note=doc_update.description if doc_update.description else f"Transferred to {db_doc.current_holder}",

                signed_at=datetime.now() if doc_update.signature_image else None,
                signer_name=doc_update.signer_name,
                signature_image=doc_update.signature_image
            )
            db.add(new_log)

    db.commit()
    db.refresh(db_doc)
    return db_doc

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.HOD]:
        raise HTTPException(status_code=403, detail="Only Admins or HODs can delete document trackers")
        
    db_doc = db.query(models.DocumentTracker).filter(models.DocumentTracker.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db.delete(db_doc)
    db.commit()
    return {"message": "Document deleted successfully"}
