import sqlite3
import os

def recalculate_budgets():
    # Database path
    db_path = os.path.join("storage", "pms.db")
    if not os.path.exists(db_path):
        db_path = os.path.join("backend", "storage", "pms.db")
        if not os.path.exists(db_path):
             print(f"Error: Database not found at {db_path}")
             return

    print(f"Connecting to database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Reset all existing budget totals to 0
        print("Resetting all category budgets to RM 0...")
        cursor.execute("UPDATE department_budgets SET amount = 0.0")
        
        # 2. Get all approved budget requests
        print("Calculating totals from approved budget requests...")
        cursor.execute("SELECT department_id, category, SUM(amount) FROM budget_requests WHERE status = 'approved' GROUP BY department_id, category")
        approved_sums = cursor.fetchall()

        if not approved_sums:
            print("No approved budget requests found. All budgets remain RM 0.")
        else:
            for dept_id, category, total_amount in approved_sums:
                print(f" - Dept {dept_id} | Category: '{category}' | Total: RM {total_amount}")
                
                # Update or Insert into department_budgets
                cursor.execute(
                    "SELECT id FROM department_budgets WHERE department_id = ? AND category = ?", 
                    (dept_id, category)
                )
                existing = cursor.fetchone()
                
                if existing:
                    cursor.execute(
                        "UPDATE department_budgets SET amount = ? WHERE id = ?",
                        (total_amount, existing[0])
                    )
                else:
                    cursor.execute(
                        "INSERT INTO department_budgets (department_id, category, amount, year) VALUES (?, ?, ?, 2024)",
                        (dept_id, category, total_amount)
                    )

        conn.commit()
        print("\nRecalculation successful! Source of truth (Budget Requests) is now synced.")
        print("Sila 'Refresh' dashboard anda sekarang. 😊🚀🐢")

    except Exception as e:
        print(f"An error occurred: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    recalculate_budgets()
