from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import extract, and_, or_
from datetime import datetime, timedelta, timezone
from app.db.database import get_db
from app.models import sql_models

router = APIRouter()

@router.get("/portfolio/dashboard", tags=["Portfolio"])
def get_portfolio_dashboard(db: Session = Depends(get_db)):
    # 1. Get all projects
    projects = db.query(sql_models.Project).all()
    
    dashboard_data = []
    
    now = datetime.now(timezone.utc)
    current_month = now.month
    current_year = now.year
    
    # Calculate next month
    if current_month == 12:
        next_month = 1
        next_year = current_year + 1
    else:
        next_month = current_month + 1
        next_year = current_year
        
    for p in projects:
        # A. Tasks This Month (Active or Completed this month)
        # Filter: planned_end is in current month OR actual_end is in current month
        tasks_this_month = db.query(sql_models.Task).filter(
            sql_models.Task.wbs_item.has(project_id=p.id),
            or_(
                and_(extract('month', sql_models.Task.planned_end) == current_month, extract('year', sql_models.Task.planned_end) == current_year),
                and_(extract('month', sql_models.Task.actual_end) == current_month, extract('year', sql_models.Task.actual_end) == current_year),
                # Also include tasks currently IN PROGRESS regardless of dates overlap
                sql_models.Task.status == sql_models.TaskStatus.IN_PROGRESS
            )
        ).limit(5).all()

        # B. Tasks Next Month (Forecast)
        # Filter: planned_start is in next month
        tasks_next_month = db.query(sql_models.Task).filter(
            sql_models.Task.wbs_item.has(project_id=p.id),
            and_(extract('month', sql_models.Task.planned_start) == next_month, extract('year', sql_models.Task.planned_start) == next_year)
        ).limit(5).all()
        
        # C. Payment Issues (Sangkut)
        # Unpaid and Overdue (planned_date < now)
        payment_issues = db.query(sql_models.Payment).filter(
            sql_models.Payment.project_id == p.id,
            sql_models.Payment.status != sql_models.PaymentStatus.PAID,
            sql_models.Payment.planned_date < now
        ).all()
        
        # D. Dynamic Status
        project_status = p.status
        if project_status != sql_models.ProjectStatus.COMPLETED:
            if len(payment_issues) > 0:
                project_status = sql_models.ProjectStatus.DELAYED
            else:
                # Check ALL overdue tasks for this project (not just this month)
                # Ensure we compare aware datetimes and handle None
                overdue_tasks_exist = False
                all_tasks = db.query(sql_models.Task).filter(
                    sql_models.Task.wbs_item.has(project_id=p.id),
                    sql_models.Task.status != sql_models.TaskStatus.COMPLETED
                ).all()
                
                for t in all_tasks:
                    if t.due_date:
                        t_aware = t.due_date.replace(tzinfo=timezone.utc) if t.due_date.tzinfo is None else t.due_date.astimezone(timezone.utc)
                        if t_aware < now:
                            overdue_tasks_exist = True
                            break
                            
                if overdue_tasks_exist:
                    project_status = sql_models.ProjectStatus.DELAYED

        dashboard_data.append({
            "project_id": p.id,
            "code": p.code,
            "name": p.name,
            "status": project_status,
            "owner": p.owner.full_name if p.owner else "Unassigned",
            "assist_coordinator": p.assist_coordinator.full_name if p.assist_coordinator else None,
            "tasks_this_month": [
                {"id": t.id, "name": t.name, "status": t.status, "due": t.due_date} 
                for t in tasks_this_month
            ],
            "tasks_next_month": [
                {"id": t.id, "name": t.name, "start": t.planned_start} 
                for t in tasks_next_month
            ],
            "payment_issues": [
                {"id": pay.id, "title": pay.title, "amount": pay.amount, "due": pay.planned_date}
                for pay in payment_issues
            ]
        })
        
    return dashboard_data
