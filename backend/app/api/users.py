from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ..db.database import get_db
from ..models import sql_models as models
from ..core import security
from .auth import get_current_user

router = APIRouter()

# --- Schemas ---

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str
    department_id: Optional[int] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[int] = None

class UserStats(BaseModel):
    active_projects: int
    pending_tasks: int
    held_documents: int

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    department_id: Optional[int]
    
    class Config:
        from_attributes = True

class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    
    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/", response_model=List[UserResponse])
async def get_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Allow all authenticated users to see user list (for sharing/assigning)
    return db.query(models.User).all()

@router.post("/", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    existing_user = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or Email already registered")
        
    hashed_password = security.get_password_hash(user.password)
    
    db_user = models.User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        password_hash=hashed_password,
        role=user.role,
        department_id=user.department_id
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.username:
        db_user.username = user_update.username
    if user_update.email:
        db_user.email = user_update.email
    if user_update.full_name:
        db_user.full_name = user_update.full_name
    if user_update.role:
        db_user.role = user_update.role
    if user_update.department_id is not None:
        db_user.department_id = user_update.department_id
        
    if user_update.password:
        db_user.password_hash = security.get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent deleting self
    if db_user.id == current_user.id:
         raise HTTPException(status_code=400, detail="Cannot delete your own account")

    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Department).all()

@router.get("/stats", response_model=List[dict])
async def get_user_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all users (except maybe the current one? No, let's show all)
    users = db.query(models.User).all()
    results = []
    for u in users:
        # Projects: where owner or assist
        proj_count = db.query(models.Project).filter(
            (models.Project.owner_id == u.id) | (models.Project.assist_coordinator_id == u.id)
        ).count()
        
        # Tasks: where assignee and not completed
        task_count = db.query(models.Task).filter(
            models.Task.assignee_id == u.id,
            models.Task.status != models.TaskStatus.COMPLETED
        ).count()
        
        # Documents: where current_holder matches full_name and not completed
        doc_count = db.query(models.DocumentTracker).filter(
            models.DocumentTracker.current_holder == u.full_name,
            models.DocumentTracker.status != "completed"
        ).count()
        
        results.append({
            "id": u.id,
            "full_name": u.full_name,
            "username": u.username,
            "role": u.role,
            "department": u.department.name if u.department else "N/A",
            "stats": {
                "active_projects": proj_count,
                "pending_tasks": task_count,
                "held_documents": doc_count
            }
        })
    return results
