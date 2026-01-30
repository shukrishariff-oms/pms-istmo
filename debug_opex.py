import sqlite3
import os

db_path = 'backend/storage/pms.db'
if not os.path.exists(db_path):
    print(f"File not found: {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("### DEPARTMENTS ###")
cursor.execute('SELECT id, name, code, budget_opex FROM departments')
for row in cursor.fetchall():
    print(f"ID: {row[0]}, Name: {row[1]}, Code: {row[2]}, Opex: {row[3]}")

print("\n### APPROVED BUDGET REQUESTS ###")
cursor.execute('SELECT id, department_id, title, amount, category FROM budget_requests WHERE status = \"approved\"')
for row in cursor.fetchall():
    print(f"ID: {row[0]}, Dept: {row[1]}, Title: {row[2]}, Amount: {row[3]}, Category: {row[4]}")

print("\n### DEPARTMENT BUDGETS (Category Budgets) ###")
cursor.execute('SELECT id, department_id, category, amount FROM department_budgets')
for row in cursor.fetchall():
    print(f"ID: {row[0]}, Dept: {row[1]}, Category: {row[2]}, Amount: {row[3]}")

conn.close()
