import sqlite3
import os

def cleanup_ghost_data():
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
        # Target exact match found in inspect_db
        target_category = 'Kitchen Supply'
        
        cursor.execute("SELECT id, department_id, amount FROM department_budgets WHERE category = ?", (target_category,))
        rows = cursor.fetchall()
        
        if not rows:
            print(f"No ghost data found for category '{target_category}'.")
            return

        print(f"Found {len(rows)} ghost entries for '{target_category}':")
        for row in rows:
            print(f" - ID: {row[0]}, Dept ID: {row[1]}, Amount: RM {row[2]}")

        print(f"\nDeleting entries for '{target_category}'...")
        cursor.execute("DELETE FROM department_budgets WHERE category = ?", (target_category,))
        
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
