import sqlite3
import os

def cleanup_ghost_data():
    # Database path
    db_path = os.path.join("storage", "pms.db")
    if not os.path.exists(db_path):
        # Fallback for local dev if run from root
        db_path = os.path.join("backend", "storage", "pms.db")
        if not os.path.exists(db_path):
             print(f"Error: Database not found at {db_path}")
             return

    print(f"Connecting to database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Identify entries for KITCHEN SUPPLY
        cursor.execute("SELECT id, department_id, amount FROM department_budgets WHERE category = 'KITCHEN SUPPLY'")
        rows = cursor.fetchall()
        
        if not rows:
            print("No ghost data found for category 'KITCHEN SUPPLY'.")
            return

        print(f"Found {len(rows)} ghost entries for 'KITCHEN SUPPLY':")
        total_ghost_amount = 0
        for row in rows:
            print(f" - ID: {row[0]}, Dept: {row[1]}, Amount: RM {row[2]}")
            total_ghost_amount += row[2]

        # 2. Delete the entries
        print(f"\nDeleting ghost entries totaling RM {total_ghost_amount}...")
        cursor.execute("DELETE FROM department_budgets WHERE category = 'KITCHEN SUPPLY'")
        
        conn.commit()
        print("Cleanup successful! Ghost data has been removed.")
        print("\nSila 'Refresh' dashboard anda sekarang. 😊🚀🐢")

    except Exception as e:
        print(f"An error occurred: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    cleanup_ghost_data()
