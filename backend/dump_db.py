import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_PATH = r'd:\My System\PMS ISTMO\storage\database\app.db'
engine = create_engine(f'sqlite:///{DB_PATH}')
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

result = db.execute(text("SELECT username, role, department_id FROM users")).fetchall()
for row in result:
    print(f"User: {row[0]}, Role: {row[1]}, Dept: {row[2]}")

depts = db.execute(text("SELECT id, name, code FROM departments")).fetchall()
for row in depts:
    print(f"Dept: {row[0]}, Name: {row[1]}, Code: {row[2]}")
