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
        # A. Fetch all tasks for this project to categorize in Python
        # This is more robust than SQLite-specific extract calls
        project_tasks = db.query(sql_models.Task).filter(
            sql_models.Task.wbs_item.has(project_id=p.id)
        ).all()

        tasks_this_month_data = [] # Will include Current Month + Overdue
        tasks_next_month_data = [] # Forecast

        for t in project_tasks:
            t_status = str(t.status).lower()
            
            # 1. Handle Overdue (Completed tasks are never overdue)
            is_overdue = False
            if t_status != "completed":
                # Check for Late Completion (Overdue)
                if t.due_date:
                    t_due = t.due_date.replace(tzinfo=timezone.utc) if t.due_date.tzinfo is None else t.due_date.astimezone(timezone.utc)
                    if t_due < now:
                        is_overdue = True
                
                # Check for Late Start (if still not started and passed start date)
                if not is_overdue and t_status == "not_started" and t.planned_start:
                    t_start = t.planned_start.replace(tzinfo=timezone.utc) if t.planned_start.tzinfo is None else t.planned_start.astimezone(timezone.utc)
                    if t_start < now:
                        is_overdue = True

            # 2. Categorize
            t_planned_end = t.planned_end.replace(tzinfo=timezone.utc) if t.planned_end and t.planned_end.tzinfo is None else (t.planned_end.astimezone(timezone.utc) if t.planned_end else None)
            t_planned_start = t.planned_start.replace(tzinfo=timezone.utc) if t.planned_start and t.planned_start.tzinfo is None else (t.planned_start.astimezone(timezone.utc) if t.planned_start else None)

            # --- This Month's Activities ---
            # Criteria: Overdue OR (Starts in current month) OR (Ends in current month) OR (In Progress)
            in_current_month = False
            if t_planned_start and t_planned_start.month == current_month and t_planned_start.year == current_year:
                in_current_month = True
            elif t_planned_end and t_planned_end.month == current_month and t_planned_end.year == current_year:
                in_current_month = True
            
            if is_overdue or in_current_month or t_status == "in_progress":
                if len(tasks_this_month_data) < 8: # Limit to 8 items per project for UI cleanliness
                    tasks_this_month_data.append({
                        "id": t.id,
                        "name": t.name,
                        "status": t.status,
                        "due": t.due_date,
                        "is_overdue": is_overdue
                    })

            # --- Next Month Forecast ---
            # Criteria: Planned to start next month
            if t_planned_start and t_planned_start.month == next_month and t_planned_start.year == next_year:
                if len(tasks_next_month_data) < 5:
                    tasks_next_month_data.append({
                        "id": t.id,
                        "name": t.name,
                        "start": t.planned_start
                    })

        # C. Payment Issues (Sangkut)
        payment_issues = db.query(sql_models.Payment).filter(
            sql_models.Payment.project_id == p.id,
            sql_models.Payment.status != sql_models.PaymentStatus.PAID,
            sql_models.Payment.planned_date < now
        ).all()
        
        # D. Dynamic Status (Inherited from previous logic)
        project_status = p.status
        if project_status != sql_models.ProjectStatus.COMPLETED:
            if len(payment_issues) > 0:
                project_status = sql_models.ProjectStatus.DELAYED
            else:
                overdue_exists = any(t['is_overdue'] for t in tasks_this_month_data if t['is_overdue'])
                # Also check all tasks if not in the limited list
                if not overdue_exists:
                    overdue_exists = any(
                        t.due_date and (t.due_date.replace(tzinfo=timezone.utc) if t.due_date.tzinfo is None else t.due_date.astimezone(timezone.utc)) < now
                        and str(t.status).lower() != "completed"
                        for t in project_tasks
                    )
                if overdue_exists:
                    project_status = sql_models.ProjectStatus.DELAYED

        dashboard_data.append({
            "project_id": p.id,
            "code": p.code,
            "name": p.name,
            "status": project_status,
            "owner": p.owner.full_name if p.owner else "Unassigned",
            "assist_coordinator": p.assist_coordinator.full_name if p.assist_coordinator else None,
            "tasks_this_month": tasks_this_month_data,
            "tasks_next_month": tasks_next_month_data,
            "payment_issues": [
                {"id": pay.id, "title": pay.title, "amount": pay.amount, "due": pay.planned_date}
                for pay in payment_issues
            ]
        })
        
    return dashboard_data
