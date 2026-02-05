import sqlite3
import os

def migrate_notes():
    db_path = os.path.join("storage", "pms.db")
    if not os.path.exists(db_path):
        db_path = os.path.join("backend", "storage", "pms.db")
    
    if not os.path.exists(db_path):
        print(f"Warning: Database not found at {db_path}. Skipping notes migration.")
        return

    print(f"Checking Notes table in: {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Create notes table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                content TEXT,
                author_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME,
                FOREIGN KEY (author_id) REFERENCES users (id)
            )
        """)
        print("Notes table verified/created.")

        # 2. Add color and is_pinned columns if missing
        cursor.execute("PRAGMA table_info(notes)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "color" not in columns:
            print("Adding color column to notes table...")
            cursor.execute("ALTER TABLE notes ADD COLUMN color TEXT DEFAULT '#ffffff'")
        
        if "is_pinned" not in columns:
            print("Adding is_pinned column to notes table...")
            cursor.execute("ALTER TABLE notes ADD COLUMN is_pinned BOOLEAN DEFAULT 0")

        conn.commit()
        print("Notes migration successful.")
    except Exception as e:
        print(f"Notes migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_notes()
