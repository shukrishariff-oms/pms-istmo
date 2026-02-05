from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models import sql_models
from app.schemas import note as note_schemas
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[note_schemas.Note])
def read_notes(db: Session = Depends(get_db)):
    notes = db.query(sql_models.Note).all()
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
        author_id=current_user.id
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/{note_id}", response_model=note_schemas.Note)
def read_note(note_id: int, db: Session = Depends(get_db)):
    db_note = db.query(sql_models.Note).filter(sql_models.Note.id == note_id).first()
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
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
    
    # Optional: check if the user is the author or admin
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
    
    if db_note.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")

    db.delete(db_note)
    db.commit()
    return {"message": "Note deleted successfully"}
