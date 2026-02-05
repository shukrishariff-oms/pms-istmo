from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .project_schemas import UserResponse

class NoteBase(BaseModel):
    title: str
    content: str
    color: Optional[str] = "#ffffff"
    is_pinned: Optional[bool] = False

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    color: Optional[str] = None
    is_pinned: Optional[bool] = None

class Note(NoteBase):
    id: int
    author_id: int
    author: Optional[UserResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
