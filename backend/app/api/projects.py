from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from typing import List, Optional
from app.db.database import get_db
from app.models import sql_models
from app.schemas import project_schemas
from app.core import security
from datetime import datetime, timezone

router = APIRouter()

# --- Projects ---

from sqlalchemy import or_, and_

def calculate_task_overdue(t, now):
    """Utility to calculate if a task is overdue based on start or due dates."""
    t_status = str(t.status).lower()
    is_overdue = False
    if t_status != "completed":
        # Late Finish
        if t.due_date:
            t_due = t.due_date.replace(tzinfo=timezone.utc) if t.due_date.tzinfo is None else t.due_date.astimezone(timezone.utc)
            if t_due < now:
                is_overdue = True
        
        # Late Start
        if not is_overdue and t_status == "not_started" and t.planned_start:
            t_start = t.planned_start.replace(tzinfo=timezone.utc) if t.planned_start.tzinfo is None else t.planned_start.astimezone(timezone.utc)
            if t_start < now:
                is_overdue = True
    return is_overdue

@router.get("/projects", tags=["Projects"], response_model=List[project_schemas.ProjectRead])
def get_projects(owner_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(sql_models.Project).options(
        joinedload(sql_models.Project.owner),
        joinedload(sql_models.Project.assist_coordinator),
        joinedload(sql_models.Project.payments),
        joinedload(sql_models.Project.wbs_items).joinedload(sql_models.WBS.tasks)
    )
    if owner_id:
        query = query.filter(
            or_(
                sql_models.Project.owner_id == owner_id,
                sql_models.Project.assist_coordinator_id == owner_id
            )
        )
    projects = query.all()
    
    for p in projects:
        # 1. Calculate CAPEX Utilization
        total_capex_paid = sum(pm.amount for pm in p.payments if str(pm.payment_type).lower() == "capex" and str(pm.status).lower() == "paid")
        if p.budget_capex and p.budget_capex > 0:
            p.capex_utilization = (total_capex_paid / p.budget_capex) * 100
        else:
            p.capex_utilization = 0.0
            
        # 2. Calculate Task Progress (Only count leaf tasks - tasks with no sub-tasks)
        total_tasks = 0
        completed_tasks = 0
        for wbs in p.wbs_items:
            for t in wbs.tasks:
                if not t.sub_tasks:  # It's a leaf task
                    total_tasks += 1
                    if str(t.status).lower() == "completed":
                        completed_tasks += 1
            
        if total_tasks > 0:
            p.task_progress = (completed_tasks / total_tasks) * 100
        else:
            p.task_progress = 0.0
            
        # 3. Derive Dynamic Status & Set Task Overdue Flags
        now = datetime.now(timezone.utc)
        any_task_overdue = False
        for wbs in p.wbs_items:
            for t in wbs.tasks:
                t.is_overdue = calculate_task_overdue(t, now)
                if t.is_overdue and not t.sub_tasks:
                    any_task_overdue = True

        # COMPLETED status is terminal, don't override it if it's already completed in DB
        if p.status != sql_models.ProjectStatus.COMPLETED:
            overdue_payments = any(
                pay.planned_date and (pay.planned_date.replace(tzinfo=timezone.utc) if pay.planned_date.tzinfo is None else pay.planned_date.astimezone(timezone.utc)) < now 
                and pay.status != sql_models.PaymentStatus.PAID 
                for pay in p.payments
            )
            if any_task_overdue or overdue_payments:
                p.status = sql_models.ProjectStatus.DELAYED
            
    return projects

@router.post("/projects", tags=["Projects"], response_model=project_schemas.ProjectRead)
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

@router.get("/projects/{project_id}", tags=["Projects"], response_model=project_schemas.ProjectRead)
def get_project_details(project_id: int, db: Session = Depends(get_db)):
    project = db.query(sql_models.Project).options(
        joinedload(sql_models.Project.owner),
        joinedload(sql_models.Project.assist_coordinator),
        joinedload(sql_models.Project.payments),
        joinedload(sql_models.Project.wbs_items).joinedload(sql_models.WBS.tasks)
    ).filter(sql_models.Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Calculate Metrics
    total_capex_paid = sum(pm.amount for pm in project.payments if str(pm.payment_type).lower() == "capex" and str(pm.status).lower() == "paid")
    if project.budget_capex and project.budget_capex > 0:
        project.capex_utilization = (total_capex_paid / project.budget_capex) * 100
    else:
        project.capex_utilization = 0.0
        
    total_tasks = 0
    completed_tasks = 0
    for wbs in project.wbs_items:
        for t in wbs.tasks:
            if not t.sub_tasks:  # Leaf task
                total_tasks += 1
                if str(t.status).lower() == "completed":
                    completed_tasks += 1
        
    if total_tasks > 0:
        project.task_progress = (completed_tasks / total_tasks) * 100
    else:
        project.task_progress = 0.0
        
    # 3. Derive Dynamic Status & Set Task Overdue Flags
    now = datetime.now(timezone.utc)
    any_task_overdue = False
    for wbs in project.wbs_items:
        for t in wbs.tasks:
            t.is_overdue = calculate_task_overdue(t, now)
            if t.is_overdue and not t.sub_tasks:
                any_task_overdue = True

    if project.status != sql_models.ProjectStatus.COMPLETED:
        overdue_payments = any(
            pay.planned_date and (pay.planned_date.replace(tzinfo=timezone.utc) if pay.planned_date.tzinfo is None else pay.planned_date.astimezone(timezone.utc)) < now 
            and pay.status != sql_models.PaymentStatus.PAID 
            for pay in project.payments
        )
        if any_task_overdue or overdue_payments:
            project.status = sql_models.ProjectStatus.DELAYED
        
    return project

# --- WBS & Tasks ---

@router.get("/projects/{project_id}/wbs", tags=["WBS"], response_model=List[project_schemas.WBSRead])
def get_project_wbs(project_id: int, db: Session = Depends(get_db)):
    wbs_items = db.query(sql_models.WBS).options(
        joinedload(sql_models.WBS.tasks).joinedload(sql_models.Task.assignee)
    ).filter(sql_models.WBS.project_id == project_id).all()
    
    # Calculate overdue flags for WBS view
    now = datetime.now(timezone.utc)
    for wbs in wbs_items:
        for t in wbs.tasks:
            t.is_overdue = calculate_task_overdue(t, now)
            
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

@router.post("/projects/{project_id}/tasks", tags=["WBS"], response_model=project_schemas.TaskRead)
def create_task(project_id: int, task: project_schemas.TaskCreate, db: Session = Depends(get_db)):
    # Verify WBS belongs to project
    wbs = db.query(sql_models.WBS).filter(sql_models.WBS.id == task.wbs_id, sql_models.WBS.project_id == project_id).first()
    if not wbs:
        raise HTTPException(status_code=400, detail="Invalid WBS ID for this project")

    new_task = sql_models.Task(
        wbs_id=task.wbs_id,
        parent_id=task.parent_id,
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

@router.delete("/wbs/{wbs_id}", tags=["WBS"])
def delete_wbs_phase(wbs_id: int, db: Session = Depends(get_db)):
    wbs = db.query(sql_models.WBS).filter(sql_models.WBS.id == wbs_id).first()
    if not wbs:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    db.delete(wbs)
    db.commit()
    return {"message": "Phase deleted successfully"}

@router.delete("/tasks/{task_id}", tags=["WBS"])
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(sql_models.Task).filter(sql_models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}

@router.post("/tasks/bulk-delete", tags=["WBS"])
def bulk_delete_tasks(task_ids: List[int], db: Session = Depends(get_db)):
    if not task_ids:
        return {"message": "No tasks selected"}
    
    # Delete tasks with IDs in the provided list
    db.query(sql_models.Task).filter(sql_models.Task.id.in_(task_ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"Successfully deleted {len(task_ids)} tasks"}

@router.put("/wbs/{wbs_id}", tags=["WBS"])
def update_wbs_phase(
    wbs_id: int, 
    wbs_update: project_schemas.WBSUpdate, 
    db: Session = Depends(get_db)
):
    wbs = db.query(sql_models.WBS).filter(sql_models.WBS.id == wbs_id).first()
    if not wbs:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    update_data = wbs_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(wbs, key, value)
    
    db.commit()
    db.refresh(wbs)
    return wbs

@router.put("/tasks/{task_id}", tags=["WBS"], response_model=project_schemas.TaskRead)
def update_task_details(
    task_id: int, 
    task_update: project_schemas.TaskUpdate, 
    db: Session = Depends(get_db)
):
    task = db.query(sql_models.Task).filter(sql_models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    
    db.commit()
    db.refresh(task)
    return task

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

@router.put("/projects/{project_id}", tags=["Projects"], response_model=project_schemas.ProjectRead)
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

@router.get("/tasks/assigned", tags=["Tasks"], response_model=List[project_schemas.TaskRead])
def get_assigned_tasks(assignee_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Fetch tasks. If assignee_id provided, filter by it. Otherwise return all (for admin/monitoring)."""
    query = db.query(sql_models.Task)
    if assignee_id:
        query = query.filter(sql_models.Task.assignee_id == assignee_id)
    return query.all()
