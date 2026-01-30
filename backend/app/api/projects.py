from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from typing import List, Optional
from app.db.database import get_db
from app.models import sql_models
from app.schemas import project_schemas
from app.core import security

router = APIRouter()

# --- Projects ---

from sqlalchemy import or_

@router.get("/projects", tags=["Projects"])
def get_projects(owner_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(sql_models.Project).options(
        joinedload(sql_models.Project.owner),
        joinedload(sql_models.Project.assist_coordinator)
    )
    if owner_id:
        query = query.filter(
            or_(
                sql_models.Project.owner_id == owner_id,
                sql_models.Project.assist_coordinator_id == owner_id
            )
        )
    return query.all()

@router.post("/projects", tags=["Projects"])
def create_project(project: project_schemas.ProjectCreate, db: Session = Depends(get_db)):
    # Check if code exists
    existing = db.query(sql_models.Project).filter(sql_models.Project.code == project.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project code already exists")
        
    new_project = sql_models.Project(
        code=project.code,
        name=project.name,
        description=project.description,
        budget_capex=project.budget_capex,
        budget_opex_allocation=project.budget_opex_allocation,
        status=project.status,
        start_date=project.start_date,
        end_date=project.end_date,
        owner_id=project.owner_id,
        assist_coordinator_id=project.assist_coordinator_id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.get("/projects/{project_id}", tags=["Projects"])
def get_project_details(project_id: int, db: Session = Depends(get_db)):
    project = db.query(sql_models.Project).options(
        joinedload(sql_models.Project.owner)
    ).filter(sql_models.Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return project

# --- WBS & Tasks ---

@router.get("/projects/{project_id}/wbs", tags=["WBS"])
def get_project_wbs(project_id: int, db: Session = Depends(get_db)):
    wbs_items = db.query(sql_models.WBS).options(
        joinedload(sql_models.WBS.tasks).joinedload(sql_models.Task.assignee)
    ).filter(sql_models.WBS.project_id == project_id).all()
    return wbs_items

@router.post("/projects/{project_id}/wbs", tags=["WBS"])
def create_wbs_phase(project_id: int, wbs: project_schemas.WBSCreate, db: Session = Depends(get_db)):
    new_wbs = sql_models.WBS(
        project_id=project_id,
        name=wbs.name,
        parent_id=wbs.parent_id
    )
    db.add(new_wbs)
    db.commit()
    db.refresh(new_wbs)
    return new_wbs

@router.post("/projects/{project_id}/tasks", tags=["WBS"])
def create_task(project_id: int, task: project_schemas.TaskCreate, db: Session = Depends(get_db)):
    # Verify WBS belongs to project
    wbs = db.query(sql_models.WBS).filter(sql_models.WBS.id == task.wbs_id, sql_models.WBS.project_id == project_id).first()
    if not wbs:
        raise HTTPException(status_code=400, detail="Invalid WBS ID for this project")

    new_task = sql_models.Task(
        wbs_id=task.wbs_id,
        name=task.name,
        description=task.description,
        assignee_id=task.assignee_id,
        status=task.status,
        planned_start=task.planned_start,
        planned_end=task.planned_end,
        due_date=task.due_date
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

# --- Finance ---

@router.get("/projects/{project_id}/payments", tags=["Finance"])
def get_project_payments(project_id: int, db: Session = Depends(get_db)):
    payments = db.query(sql_models.Payment).filter(
        sql_models.Payment.project_id == project_id
    ).order_by(sql_models.Payment.planned_date).all()
    return payments

@router.post("/projects/{project_id}/payments", tags=["Finance"])
def create_payment(project_id: int, payment: project_schemas.PaymentCreate, db: Session = Depends(get_db)):
    new_payment = sql_models.Payment(
        project_id=project_id,
        title=payment.title,
        vendor_name=payment.vendor_name,
        amount=payment.amount,
        payment_type=payment.payment_type,
        planned_date=payment.planned_date,
        status=payment.status
    )
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    return new_payment

@router.put("/payments/{payment_id}", tags=["Finance"])
def update_payment(
    payment_id: int, 
    payment_update: project_schemas.PaymentUpdate, 
    db: Session = Depends(get_db)
):
    payment = db.query(sql_models.Payment).filter(sql_models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    update_data = payment_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(payment, key, value)
    
    db.commit()
    db.refresh(payment)
    return payment

@router.delete("/payments/{payment_id}", tags=["Finance"])
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(sql_models.Payment).filter(sql_models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    db.delete(payment)
    db.commit()
    return {"message": "Payment deleted successfully"}

@router.delete("/projects/{project_id}", tags=["Projects"])
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(sql_models.Project).filter(sql_models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}

@router.put("/projects/{project_id}", tags=["Projects"])
def update_project(
    project_id: int, 
    project_update: project_schemas.ProjectUpdate, 
    db: Session = Depends(get_db)
):
    db_project = db.query(sql_models.Project).filter(sql_models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update only provided fields
    update_data = project_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/tasks/assigned", tags=["Tasks"])
def get_assigned_tasks(assignee_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Fetch tasks. If assignee_id provided, filter by it. Otherwise return all (for admin/monitoring)."""
    query = db.query(sql_models.Task)
    if assignee_id:
        query = query.filter(sql_models.Task.assignee_id == assignee_id)
    return query.all()
