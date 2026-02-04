import sqlite3
import os

def check_metrics():
    db_path = 'backend/storage/pms.db'
    if not os.path.exists(db_path):
        # Try finding in current directory if absolute pathing is weird
        db_path = 'storage/pms.db'
        
    print(f"Checking DB: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name, budget_capex FROM projects")
    projects = cursor.fetchall()
    
    for pid, name, budget in projects:
        print(f"\nProject: {name} (ID: {pid}, Budget: {budget})")
        
        # Get all tasks
        cursor.execute("SELECT id, name, parent_id, status FROM tasks WHERE wbs_id IN (SELECT id FROM wbs WHERE project_id=?)", (pid,))
        all_tasks = cursor.fetchall()
        
        # Identify leaf tasks (those that never appear as a parent_id)
        parent_ids = {t[2] for t in all_tasks if t[2] is not None}
        leaf_tasks = [t for t in all_tasks if t[0] not in parent_ids]
        
        total_leafs = len(leaf_tasks)
        completed_leafs = [t for t in leaf_tasks if t[3].lower() == 'completed']
        num_completed = len(completed_leafs)
        
        progress = (num_completed / total_leafs * 100) if total_leafs > 0 else 0
        print(f"  Leaf Tasks: {num_completed}/{total_leafs} completed")
        print(f"  Calculated Progress: {progress}%")
        
        # Check Payments
        cursor.execute("SELECT amount FROM payments WHERE project_id=? AND status='paid' AND payment_type='capex'", (pid,))
        paid_amounts = cursor.fetchall()
        total_paid = sum(p[0] for p in paid_amounts)
        
        utilization = (total_paid / budget * 100) if budget > 0 else 0
        print(f"  PAID CAPEX: {total_paid}")
        print(f"  Calculated Utilization: {utilization}%")
        
    conn.close()

if __name__ == "__main__":
    check_metrics()
