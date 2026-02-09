
import sys
import os
import sqlite3
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_path():
    # Try to find the DB in the storage directory first (Production/Docker volume)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    storage_db = os.path.join(base_dir, "storage", "pms.db")
    
    if os.path.exists(storage_db):
        return storage_db
    
    # Fallback to local pms.db in backend root (Dev)
    local_db = os.path.join(base_dir, "pms.db")
    if os.path.exists(local_db):
        return local_db
        
    return storage_db # Default to storage if neither exists (will likely fail to connect but that's expected)

def run_migrations():
    db_path = get_db_path()
    logger.info(f"Checking database migrations at: {db_path}")
    
    if not os.path.exists(db_path):
        logger.warning(f"Database not found at {db_path}. Skipping migrations.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # --- Migration 1: Add 'position' column to 'tasks' ---
        logger.info("Checking for 'position' column in 'tasks' table...")
        cursor.execute("PRAGMA table_info(tasks)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "position" not in columns:
            logger.info("Adding 'position' column to 'tasks' table...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0")
            
            # Initialize positions
            logger.info("Initializing positions for existing tasks...")
            
            # Root tasks
            cursor.execute("SELECT id, wbs_id FROM tasks WHERE parent_id IS NULL ORDER BY id")
            root_tasks = cursor.fetchall()
            tasks_by_wbs = {}
            for t_id, wbs_id in root_tasks:
                if wbs_id not in tasks_by_wbs: tasks_by_wbs[wbs_id] = []
                tasks_by_wbs[wbs_id].append(t_id)
            
            for wbs_id, task_ids in tasks_by_wbs.items():
                for index, task_id in enumerate(task_ids):
                    cursor.execute("UPDATE tasks SET position = ? WHERE id = ?", (index, task_id))

            # Subtasks
            cursor.execute("SELECT id, parent_id FROM tasks WHERE parent_id IS NOT NULL ORDER BY id")
            sub_tasks = cursor.fetchall()
            tasks_by_parent = {}
            for t_id, parent_id in sub_tasks:
                if parent_id not in tasks_by_parent: tasks_by_parent[parent_id] = []
                tasks_by_parent[parent_id].append(t_id)
            
            for parent_id, task_ids in tasks_by_parent.items():
                for index, task_id in enumerate(task_ids):
                    cursor.execute("UPDATE tasks SET position = ? WHERE id = ?", (index, task_id))
            
            conn.commit()
            logger.info("Successfully added 'position' column and initialized data.")
        else:
            logger.info("'position' column already exists.")

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    run_migrations()
