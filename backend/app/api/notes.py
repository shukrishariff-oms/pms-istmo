from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models import sql_models
from app.schemas import note as note_schemas
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[note_schemas.Note])
def read_notes(
    db: Session = Depends(get_db),
    current_user: sql_models.User = Depends(get_current_user)
):
    # Admin sees all. Others see own notes OR shared notes.
    if current_user.role == "admin":
        return db.query(sql_models.Note).all()
    
    notes = db.query(sql_models.Note).filter(
        (sql_models.Note.author_id == current_user.id) | 
        (sql_models.Note.shared_with.any(id=current_user.id))
    ).all()
    return notes

@router.post("/", response_model=note_schemas.Note)
def create_note(
    note: note_schemas.NoteCreate, 
    db: Session = Depends(get_db),
    current_user: sql_models.User = Depends(get_current_user)
):
    db_note = sql_models.Note(
        title=note.title,
        content=note.content,
        color=note.color,
        is_pinned=note.is_pinned,
        reminder_date=note.reminder_date,
        is_completed=note.is_completed,
        author_id=current_user.id
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/{note_id}", response_model=note_schemas.Note)
def read_note(
    note_id: int, 
    db: Session = Depends(get_db),
    current_user: sql_models.User = Depends(get_current_user)
):
    db_note = db.query(sql_models.Note).filter(sql_models.Note.id == note_id).first()
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check if the user is the author, admin, or shared with
    is_shared = any(u.id == current_user.id for u in db_note.shared_with)
    if db_note.author_id != current_user.id and current_user.role != "admin" and not is_shared:
        raise HTTPException(status_code=403, detail="Not authorized to view this note")
        
    return db_note

@router.put("/{note_id}", response_model=note_schemas.Note)
def update_note(
    note_id: int, 
    note: note_schemas.NoteUpdate, 
    db: Session = Depends(get_db),
    current_user: sql_models.User = Depends(get_current_user)
):
    db_note = db.query(sql_models.Note).filter(sql_models.Note.id == note_id).first()
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check if the user is the author or admin (only author/admin can EDIT)
    if db_note.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this note")

    update_data = note.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_note, key, value)
    
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/{note_id}")
def delete_note(
    note_id: int, 
    db: Session = Depends(get_db),
    current_user: sql_models.User = Depends(get_current_user)
):
    db_note = db.query(sql_models.Note).filter(sql_models.Note.id == note_id).first()
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check if the user is the author or admin (only author/admin can DELETE)
    if db_note.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")

    db.delete(db_note)
    db.commit()
    return {"message": "Note deleted successfully"}

@router.post("/{note_id}/share", response_model=note_schemas.Note)
def share_note(
    note_id: int,
    share: note_schemas.NoteShare,
    db: Session = Depends(get_db),
    current_user: sql_models.User = Depends(get_current_user)
):
    db_note = db.query(sql_models.Note).filter(sql_models.Note.id == note_id).first()
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Only author/admin can share
    if db_note.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to share this note")
        
    # Get users to share with
    users = db.query(sql_models.User).filter(sql_models.User.id.in_(share.user_ids)).all()
    db_note.shared_with = users
    
    db.commit()
    db.refresh(db_note)
    return db_note
