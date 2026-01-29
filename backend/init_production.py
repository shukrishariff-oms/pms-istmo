from app.db.database import engine, SessionLocal, Base
from app.models import sql_models
from app.core.security import get_password_hash
from datetime import datetime

def init_production():
    print("Dropping all tables (DATA RESET)...")
    Base.metadata.drop_all(bind=engine)

    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("Seeding Essential Departments...")
    istmo_dept = sql_models.Department(
        name="Information Technology (ISTMO)", 
        code="ISTMO", 
        budget_opex=0.0
    )
    db.add(istmo_dept)
    db.commit()
    db.refresh(istmo_dept)

    print("Seeding Production Users...")
    # Essential production users
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
            department_id=istmo_dept.id
        )
        users.append(db_user)
        
    db.add_all(users)
    db.commit()

    print("Production Database Initialized Successfully.")
    db.close()

if __name__ == "__main__":
    init_production()
