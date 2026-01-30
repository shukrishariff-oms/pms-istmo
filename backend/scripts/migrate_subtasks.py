import sqlite3
import os

def migrate():
    # backend/storage/pms.db
    db_path = os.path.join("storage", "pms.db")
    
    if not os.path.exists(db_path):
        # Maybe we are in root?
        db_path = os.path.join("backend", "storage", "pms.db")
    
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return

    print(f"Migrating database: {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if parent_id already exists to avoid errors
        cursor.execute("PRAGMA table_info(tasks)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "parent_id" not in columns:
            print("Adding parent_id column to tasks table...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN parent_id INTEGER")
            print("Migration successful: parent_id column added.")
        else:
            print("Migration skipped: parent_id column already exists.")
            
        conn.commit()
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
