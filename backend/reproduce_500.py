from app.db.database import SessionLocal, engine, Base
from app.models import sql_models
from app.schemas import project_schemas
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
import json

def json_serial(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError ('Type %s not serializable' % type(obj))

def reproduce():
    # 1. Setup DB
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 2. Ensure we have a user
        user = db.query(sql_models.User).first()
        if not user:
            print("No user found, please run init_db.py first.")
            return

        # 3. Create a test project
        proj = sql_models.Project(
            code="TEST-500",
            name="Test 500 Reproduction",
            description="Testing circular references",
            budget_capex=1000.0,
            budget_opex_allocation=500.0,
            status="on_track",
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=30),
            owner_id=user.id
        )
        db.add(proj)
        db.commit()
        db.refresh(proj)

        # 4. Create WBS
        wbs = sql_models.WBS(project_id=proj.id, name="Phase 1")
        db.add(wbs)
        db.commit()
        db.refresh(wbs)

        # 5. Create Parent Task
        parent_task = sql_models.Task(
            wbs_id=wbs.id,
            name="Parent Task",
            status="not_started",
            due_date=datetime.now() + timedelta(days=10)
        )
        db.add(parent_task)
        db.commit()
        db.refresh(parent_task)

        # 6. Create Sub Task
        sub_task = sql_models.Task(
            wbs_id=wbs.id,
            parent_id=parent_task.id,
            name="Sub Task",
            status="not_started",
            due_date=datetime.now() + timedelta(days=15)
        )
        db.add(sub_task)
        db.commit()
        db.refresh(sub_task)

        print(f"Created Project {proj.id}, WBS {wbs.id}, Parent {parent_task.id}, Sub {sub_task.id}")

        # 7. Test Serialization
        print("\nTesting WBS Serialization...")
        wbs_from_db = db.query(sql_models.WBS).options(
            joinedload(sql_models.WBS.tasks).joinedload(sql_models.Task.assignee)
        ).filter(sql_models.WBS.id == wbs.id).first()

        try:
            p_wbs = project_schemas.WBSRead.from_orm(wbs_from_db)
            print("WBSRead.from_orm successful")
            json_data = json.dumps(p_wbs.dict(), default=json_serial)
            print("JSON serialization successful")
            # print(json.dumps(p_wbs.dict(), default=json_serial, indent=2))
        except Exception as e:
            print(f"FAILED: {e}")
            import traceback
            traceback.print_exc()

    finally:
        db.close()

if __name__ == "__main__":
    reproduce()
