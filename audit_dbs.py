import sqlite3
import os

databases = [
    'backend/pms.db',
    'backend/storage/pms.db',
    'storage/database/app.db',
    'verify_pms.db'
]

def audit_db(db_path):
    if not os.path.exists(db_path):
        return
    print(f"\nAUDITING: {db_path}")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r[0] for r in cursor.fetchall()]
        print(f"  Tables: {tables}")
        
        if 'budget_requests' in tables:
            cursor.execute("SELECT id, title, category, amount, status FROM budget_requests")
            requests = cursor.fetchall()
            print(f"  Requests ({len(requests)}):")
            for r in requests:
                print(f"    {r}")
                
        if 'department_budgets' in tables:
            cursor.execute("SELECT category, amount FROM department_budgets")
            budgets = cursor.fetchall()
            print(f"  Budgets ({len(budgets)}):")
            for b in budgets:
                print(f"    {b}")
                
        conn.close()
    except Exception as e:
        print(f"  Error: {e}")

if __name__ == "__main__":
    for db in databases:
        audit_db(db)
