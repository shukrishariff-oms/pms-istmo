from app.db.database import SessionLocal
from app.models import sql_models

def migrate():
    db = SessionLocal()
    print("Migrating departments to ISTMO branding...")
    
    # 1. Try to find ISTMO Department
    istmo_dept = db.query(sql_models.Department).filter(
        (sql_models.Department.code == "ISTMO") | (sql_models.Department.name == "ISTMO Department")
    ).first()
    
    if istmo_dept:
        print(f"ISTMO Department already exists (ID: {istmo_dept.id}).")
        target_dept_id = istmo_dept.id
    else:
        # 2. Try to find IT Department and rename it
        it_dept = db.query(sql_models.Department).filter(
            (sql_models.Department.code == "IT") | (sql_models.Department.name == "Information Technology")
        ).first()
        
        if it_dept:
            print(f"Updating Department ID {it_dept.id}: {it_dept.name} -> ISTMO Department")
            it_dept.name = "ISTMO Department"
            it_dept.code = "ISTMO"
            db.commit()
            db.refresh(it_dept)
            target_dept_id = it_dept.id
        else:
            # 3. Create ISTMO Department if none of the above exist
            print("Creating ISTMO Department...")
            new_dept = sql_models.Department(name="ISTMO Department", code="ISTMO", budget_opex=500000.0)
            db.add(new_dept)
            db.commit()
            db.refresh(new_dept)
            target_dept_id = new_dept.id

    # 2. Assign all unassigned users to ISTMO Department
    print("Assigning unassigned staff to ISTMO Department...")
    unassigned_users = db.query(sql_models.User).filter(sql_models.User.department_id == None).all()
    
    count = 0
    for u in unassigned_users:
        u.department_id = target_dept_id
        count += 1
        
    db.commit()
    print(f"Successfully reassigned {count} users.")
    print("Migration complete.")
    db.close()

if __name__ == "__main__":
    migrate()
