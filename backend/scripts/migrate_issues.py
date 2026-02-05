import sqlite3
import os

def migrate_issues():
    db_path = os.path.join("storage", "pms.db")
    if not os.path.exists(db_path):
        db_path = os.path.join("backend", "storage", "pms.db")
    
    if not os.path.exists(db_path):
        print(f"Warning: Database not found at {db_path}. Skipping issues migration.")
        return

    print(f"Checking Issues table in: {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Create issues table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS issues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                description TEXT,
                category TEXT,
                priority TEXT DEFAULT 'medium',
                status TEXT DEFAULT 'open',
                reporter_id INTEGER,
                assignee_id INTEGER,
                project_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME,
                FOREIGN KEY (reporter_id) REFERENCES users (id),
                FOREIGN KEY (assignee_id) REFERENCES users (id),
                FOREIGN KEY (project_id) REFERENCES projects (id)
            )
        """)
        print("Issues table verified/created.")
        conn.commit()
        print("Issues migration successful.")
    except Exception as e:
        print(f"Issues migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_issues()
