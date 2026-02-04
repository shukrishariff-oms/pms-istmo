from app.db.database import SessionLocal
from app.models import sql_models

def debug_project(project_id):
    db = SessionLocal()
    project = db.query(sql_models.Project).filter(sql_models.Project.id == project_id).first()
    if not project:
        print("Project not found")
        return

    print(f"Project: {project.name} ({project.code})")
    print(f"Budget CAPEX: {project.budget_capex}")
    
    total_tasks = 0
    completed_tasks = 0
    for wbs in project.wbs_items:
        print(f"Phase: {wbs.name} ({len(wbs.tasks)} tasks)")
        total_tasks += len(wbs.tasks)
        for t in wbs.tasks:
            status = str(t.status).lower()
            if status == "completed":
                completed_tasks += 1
            print(f"  - Task: {t.name}, Status: {status}")
            
    print(f"\nTotal Tasks: {total_tasks}")
    print(f"Completed Tasks: {completed_tasks}")
    if total_tasks > 0:
        print(f"Calculated Progress: {(completed_tasks / total_tasks) * 100}%")
    
    total_capex_paid = sum(pm.amount for pm in project.payments if str(pm.payment_type).lower() == "capex" and str(pm.status).lower() == "paid")
    print(f"\nTotal CAPEX Paid: {total_capex_paid}")
    if project.budget_capex > 0:
        print(f"Calculated Utilization: {(total_capex_paid / project.budget_capex) * 100}%")
    
    db.close()

if __name__ == "__main__":
    # Assuming project ID 1 based on common patterns, but we should find it.
    debug_project(1)
