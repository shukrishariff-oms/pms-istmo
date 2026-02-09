
import sys
import os
import sqlite3

# Add parent directory to path to allow importing app modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "pms.db")

def migrate():
    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Check if 'position' column exists
    cursor.execute("PRAGMA table_info(tasks)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if "position" in columns:
        print("'position' column already exists in 'tasks' table.")
    else:
        print("Adding 'position' column to 'tasks' table...")
        try:
            cursor.execute("ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0")
            print("Column added successfully.")
        except sqlite3.Error as e:
            print(f"Error adding column: {e}")
            conn.close()
            return

    # 2. Initialize position for existing tasks
    print("Initializing positions for existing tasks...")
    
    # Get all parent tasks (no parent_id)
    cursor.execute("SELECT id, wbs_id FROM tasks WHERE parent_id IS NULL ORDER BY id")
    root_tasks = cursor.fetchall() # [(id, wbs_id), ...]
    
    # Group by WBS ID to order them per phase
    tasks_by_wbs = {}
    for t_id, wbs_id in root_tasks:
        if wbs_id not in tasks_by_wbs:
            tasks_by_wbs[wbs_id] = []
        tasks_by_wbs[wbs_id].append(t_id)
        
    # Update root tasks position
    count = 0
    for wbs_id, task_ids in tasks_by_wbs.items():
        for index, task_id in enumerate(task_ids):
            cursor.execute("UPDATE tasks SET position = ? WHERE id = ?", (index, task_id))
            count += 1
            
    # Get all subtasks (grouped by parent_id)
    cursor.execute("SELECT id, parent_id FROM tasks WHERE parent_id IS NOT NULL ORDER BY id")
    sub_tasks = cursor.fetchall()
    
    tasks_by_parent = {}
    for t_id, parent_id in sub_tasks:
        if parent_id not in tasks_by_parent:
            tasks_by_parent[parent_id] = []
        tasks_by_parent[parent_id].append(t_id)
        
    # Update subtasks position
    for parent_id, task_ids in tasks_by_parent.items():
        for index, task_id in enumerate(task_ids):
            cursor.execute("UPDATE tasks SET position = ? WHERE id = ?", (index, task_id))
            count += 1

    conn.commit()
    print(f"Migration completed. Updated {count} tasks.")
    conn.close()

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
    else:
        migrate()
