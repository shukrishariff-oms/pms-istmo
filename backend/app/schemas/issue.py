from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .project_schemas import UserResponse, ProjectRead

class IssueBase(BaseModel):
    title: str
    description: str
    category: str
    priority: Optional[str] = "medium"
    status: Optional[str] = "open"
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None

class IssueCreate(IssueBase):
    pass

class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[int] = None
    project_id: Optional[int] = None

class Issue(IssueBase):
    id: int
    reporter_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Optional nested responses
    reporter: Optional[UserResponse] = None
    assignee: Optional[UserResponse] = None
    project: Optional[ProjectRead] = None

    class Config:
        from_attributes = True
