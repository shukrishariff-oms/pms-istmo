import sqlite3
import os

def inspect_db():
    db_path = os.path.join("storage", "pms.db")
    if not os.path.exists(db_path):
        db_path = os.path.join("backend", "storage", "pms.db")
        if not os.path.exists(db_path):
             print(f"Error: Database not found at {db_path}")
             return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        print("--- DEPARTMENT BUDGETS (Source of Truth) ---")
        cursor.execute("SELECT id, category, amount FROM department_budgets")
        budgets = cursor.fetchall()
        for b in budgets:
            print(f"ID: {b[0]} | Category: '{b[1]}' | Amount: RM {b[2]}")
        
        print("\n--- BUDGET REQUESTS (History) ---")
        cursor.execute("SELECT id, category, amount, status FROM budget_requests")
        requests = cursor.fetchall()
        for r in requests:
            print(f"ID: {r[0]} | Category: '{r[1]}' | Amount: RM {r[2]} | Status: {r[3]}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    inspect_db()
