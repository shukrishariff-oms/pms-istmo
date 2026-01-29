from app.db.database import engine, SessionLocal, Base
from app.models import sql_models
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import random

def create_project_data(db, owner, code, name, description, status, capex, opex, start_offset, duration):
    # Create Project
    start_date = datetime.now() + timedelta(days=start_offset)
    end_date = start_date + timedelta(days=duration)
    
    proj = sql_models.Project(
        code=code,
        name=name,
        description=description,
        budget_capex=capex,
        budget_opex_allocation=opex,
        status=status,
        start_date=start_date,
        end_date=end_date,
        owner_id=owner.id
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    
    # Create Standard WBS
    wbs_phases = []
    for i, phase_name in enumerate(["1.0 Planning", "2.0 Implementation", "3.0 Closing"]):
        w = sql_models.WBS(project_id=proj.id, name=phase_name, parent_id=None)
        db.add(w)
        db.commit()
        db.refresh(w)
        wbs_phases.append(w)
        
    # Create Tasks based on project status
    tasks = []
    
    # Logic to generate tasks based on project status
    # 1. COMPLETED: All tasks done
    # 2. IN_PROGRESS: Mix of Done, In Progress, Not Started
    # 3. DELAYED: Overdue incomplete tasks
    # 4. CANCELLED: Stopped in middle
    
    task_templates = [
        ("Requirement Gathering", wbs_phases[0]),
        ("Procurement Approval", wbs_phases[0]),
        ("Site Preparation", wbs_phases[1]),
        ("Equipment Installation", wbs_phases[1]),
        ("System Configuration", wbs_phases[1]),
        ("UAT Testing", wbs_phases[1]),
        ("Final Signoff", wbs_phases[2])
    ]
    
    for i, (t_name, wbs_item) in enumerate(task_templates):
        t_status = sql_models.TaskStatus.NOT_STARTED
        p_start = start_date + timedelta(days=i*10)
        p_end = p_start + timedelta(days=8)
        due = p_end
        
        if status == sql_models.ProjectStatus.COMPLETED:
            t_status = sql_models.TaskStatus.COMPLETED
        elif status == sql_models.ProjectStatus.DELAYED and i < 4:
            t_status = sql_models.TaskStatus.BLOCKED if i == 3 else sql_models.TaskStatus.COMPLETED
            if t_status == sql_models.TaskStatus.BLOCKED:
                due = datetime.now() - timedelta(days=10) # Overdue
        elif status == sql_models.ProjectStatus.ON_TRACK or status == sql_models.ProjectStatus.AT_RISK:
             if i < 2: t_status = sql_models.TaskStatus.COMPLETED
             elif i == 2: t_status = sql_models.TaskStatus.IN_PROGRESS
        
        task = sql_models.Task(
            wbs_id=wbs_item.id,
            name=t_name,
            assignee_id=owner.id,
            status=t_status,
            planned_start=p_start,
            planned_end=p_end,
            due_date=due
        )
        tasks.append(task)
        
    db.add_all(tasks)
    
    # Payments
    pay1 = sql_models.Payment(
        project_id=proj.id, title="Initial Claim", vendor_name="Vendor A",
        amount=capex * 0.2, payment_type=sql_models.PaymentType.CAPEX,
        status=sql_models.PaymentStatus.PAID if status != sql_models.ProjectStatus.AT_RISK else sql_models.PaymentStatus.UNPAID,
        planned_date=start_date + timedelta(days=15)
    )
    db.add(pay1)

def init_db():
    print("Dropping all tables (Dev Reset)...")
    Base.metadata.drop_all(bind=engine)

    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("Seeding Departments...")
    it_dept = sql_models.Department(name="Information Technology", code="IT", budget_opex=500000.0)
    db.add(it_dept)
    db.commit()
    db.refresh(it_dept)

    print("Seeding Users...")
    # 1. Create Users
    users_data = [
        {"username": "admin", "email": "admin@dpft.local", "full_name": "System Admin", "role": sql_models.UserRole.ADMIN, "password": "admin123"},
        {"username": "firdauszul", "email": "firdauszul@ijn.com.my", "full_name": "Muhammad Firdaus Bin Zulkiflee", "role": sql_models.UserRole.ADMIN, "password": "password123"},
        {"username": "rahimr", "email": "rahimr@ijn.com.my", "full_name": "Rahim Rasimin", "role": sql_models.UserRole.HOD, "password": "password123"},
        {"username": "khairulamri", "email": "khairulamri@ijn.com.my", "full_name": "Khairul Amri B. Zainudin", "role": sql_models.UserRole.STAFF, "password": "password123"},
        {"username": "shukrishariff", "email": "shukrishariff@ijn.com.my", "full_name": "Mohd Shukri B. Shariff", "role": sql_models.UserRole.ADMIN, "password": "password123"},
        {"username": "shahidahyusof", "email": "shahidahyusof@ijn.com.my", "full_name": "Norshahidah Bt Md Yusof", "role": sql_models.UserRole.STAFF, "password": "password123"},
        {"username": "finance", "email": "finance@dpft.local", "full_name": "Finance Officer", "role": sql_models.UserRole.FINANCE, "password": "password123"},
    ]
    
    users = []
    for u in users_data:
        db_user = sql_models.User(
            username=u["username"],
            email=u["email"],
            full_name=u["full_name"],
            role=u["role"],
            password_hash=get_password_hash(u["password"]),
            department_id=it_dept.id
        )
        users.append(db_user)
        
    db.add_all(users)
    db.commit()

    print("Seeding Budget Requests...")
    # Initial Start Budget (Approved)
    start_budget = sql_models.BudgetRequest(
        department_id=it_dept.id, requester_id=users[1].id, # HOD
        title="Initial IT Budget Allocation", amount=500000.0, category="General", justification="Annual allocation",
        status=sql_models.RequestStatus.APPROVED, approved_by_id=users[0].id, approved_at=datetime.now()
    )
    db.add(start_budget)
    
    # Pending Request
    req1 = sql_models.BudgetRequest(
        department_id=it_dept.id, requester_id=users[3].id, # staff1
        title="Q3 Server Maintenance", amount=15000.0, category="Maintenance", justification="Scheduled maintenance for rack 3-5",
        status=sql_models.RequestStatus.PENDING
    )
    db.add(req1)

    # Kitchen Supply Request (Example from user)
    req2 = sql_models.BudgetRequest(
        department_id=it_dept.id, requester_id=users[3].id,
        title="Pantry Restock", amount=2000.0, category="Kitchen Supply", justification="Coffee, snacks for Q1",
        status=sql_models.RequestStatus.PENDING
    )
    db.add(req2)

    db.commit()

    staff1 = db.query(sql_models.User).filter(sql_models.User.username == "staff1").first()
    staff2 = db.query(sql_models.User).filter(sql_models.User.username == "staff2").first()

    print("Seeding 5 Scenarios...")

    # 1. Successful Complete
    create_project_data(db, staff1, "IT-2025-COMP", "Office Network Upgrade (Done)", 
                       "Full upgrade of office wifi and LAN points.", 
                       sql_models.ProjectStatus.COMPLETED, 100000.0, 10000.0, -100, 90)

    # 2. In Progress (On Track)
    create_project_data(db, staff1, "IT-2026-HQ-001", "HQ Data Center Refresh", 
                       "Strategic overhaul of server infrastructure.", 
                       sql_models.ProjectStatus.ON_TRACK, 1200000.0, 150000.0, -30, 120)

    # 3. In Progress (At Risk/Just Started)
    create_project_data(db, staff2, "IT-2026-SEC-002", "Cybersecurity Hardening", 
                       "Firewall and endpoint protection rollout.", 
                       sql_models.ProjectStatus.ON_TRACK, 450000.0, 50000.0, -10, 60)

    # 4. Delayed
    create_project_data(db, staff2, "IT-2026-ERP-055", "Legacy ERP Integration", 
                       "Integration with legacy accounting system.", 
                       sql_models.ProjectStatus.DELAYED, 80000.0, 0.0, -60, 45) # Should be done by now

    # 5. Connect Canceled/At Risk (Using At Risk as Cancelled proxy or just At Risk)
    # The Enum only has ON_TRACK, AT_RISK, DELAYED, COMPLETED. Let's use AT_RISK to simulate a troubled one
    create_project_data(db, staff1, "IT-2026-BR-099", "New Branch Setup (Hold)", 
                       "IT setup for suspended branch location.", 
                       sql_models.ProjectStatus.AT_RISK, 250000.0, 20000.0, -90, 60)

    print("Seeding complete.")
    db.close()

if __name__ == "__main__":
    init_db()
