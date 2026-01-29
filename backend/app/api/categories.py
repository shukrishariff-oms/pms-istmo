from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ..db.database import get_db
from ..models import sql_models as models
from .auth import get_current_user

router = APIRouter()

# --- Schemas ---

class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    pass

class CategorySimple(CategoryBase):
    id: int
    
    class Config:
        from_attributes = True

class CategoryResponse(CategorySimple):
    children: List['CategoryResponse'] = []
    
    class Config:
        from_attributes = True

# Required for recursive model
CategoryResponse.update_forward_refs()

# --- Endpoints ---

@router.get("/", response_model=List[CategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    # Fetch only top-level categories, children are loaded via relationship
    return db.query(models.FinanceCategory).filter(models.FinanceCategory.parent_id == None).all()

@router.post("/", response_model=CategorySimple)
async def create_category(
    category: CategoryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.HOD]:
        raise HTTPException(status_code=403, detail="Only Admins or HODs can manage categories")
        
    # Check if name exists (case insensitive ideally, but starting simple)
    existing = db.query(models.FinanceCategory).filter(models.FinanceCategory.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
        
    db_cat = models.FinanceCategory(**category.dict())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.put("/{cat_id}", response_model=CategorySimple)
async def update_category(
    cat_id: int,
    category: CategoryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.HOD]:
        raise HTTPException(status_code=403, detail="Only Admins or HODs can manage categories")
        
    db_cat = db.query(models.FinanceCategory).filter(models.FinanceCategory.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
        
    db_cat.name = category.name
    db_cat.parent_id = category.parent_id
    
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.delete("/{cat_id}")
async def delete_category(
    cat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.HOD]:
        raise HTTPException(status_code=403, detail="Only Admins or HODs can manage categories")
        
    db_cat = db.query(models.FinanceCategory).filter(models.FinanceCategory.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
        
    db.delete(db_cat)
    db.commit()
    return {"message": "Category deleted"}
