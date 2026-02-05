from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db.database import get_db
from ..models import sql_models
from ..schemas import issue as issue_schemas
from .auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[issue_schemas.Issue])
def get_issues(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: sql_models.User = Depends(get_current_user)
):
    query = db.query(sql_models.Issue)
    if status:
        query = query.filter(sql_models.Issue.status == status)
    if priority:
        query = query.filter(sql_models.Issue.priority == priority)
    if project_id:
        query = query.filter(sql_models.Issue.project_id == project_id)
        
    return query.order_by(sql_models.Issue.created_at.desc()).all()

@router.post("/", response_model=issue_schemas.Issue)
def create_issue(
    issue: issue_schemas.IssueCreate,
    db: Session = Depends(get_db),
    current_user: sql_models.User = Depends(get_current_user)
):
    db_issue = sql_models.Issue(
        **issue.dict(),
        reporter_id=current_user.id
    )
    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)
    return db_issue

@router.get("/{issue_id}", response_model=issue_schemas.Issue)
def get_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: sql_models.User = Depends(get_current_user)
):
    db_issue = db.query(sql_models.Issue).filter(sql_models.Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return db_issue

@router.put("/{issue_id}", response_model=issue_schemas.Issue)
def update_issue(
    issue_id: int,
    issue_update: issue_schemas.IssueUpdate,
    db: Session = Depends(get_db),
    current_user: sql_models.User = Depends(get_current_user)
):
    db_issue = db.query(sql_models.Issue).filter(sql_models.Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    update_data = issue_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_issue, key, value)
        
    db.commit()
    db.refresh(db_issue)
    return db_issue

@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: sql_models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete issues")
        
    db_issue = db.query(sql_models.Issue).filter(sql_models.Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    db.delete(db_issue)
    db.commit()
    return None
