import sqlite3
import os

def fix_category_mismatch():
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
        target_title = 'Barang Office'
        new_category = 'Office Supply'
        old_category = 'General'
        
        # 1. Find the budget request
        cursor.execute("SELECT id, department_id, amount, category FROM budget_requests WHERE title = ?", (target_title,))
        req = cursor.fetchone()
        
        if not req:
            print(f"Error: Permohonan bertajuk '{target_title}' tidak dijumpai.")
            return
            
        req_id, dept_id, amount, current_cat = req
        print(f"Found request: ID {req_id}, Amount RM {amount}, Current category: '{current_cat}'")

        if current_cat == new_category:
            print(f"Notice: Permohonan ini sudah pun berada dalam kategori '{new_category}'. Tiada apa perlu dibuat.")
            return

        # 2. Update the Budget Request category
        print(f"Updating request ID {req_id} to category '{new_category}'...")
        cursor.execute("UPDATE budget_requests SET category = ? WHERE id = ?", (new_category, req_id))

        # 3. Adjust the Department Budget (The "Tabung")
        print(f"Adjusting department budgets for dept {dept_id}...")
        
        # Deduct from General
        cursor.execute("UPDATE department_budgets SET amount = amount - ? WHERE department_id = ? AND category = ?", (amount, dept_id, old_category))
        print(f" - RM {amount} ditolak daripada '{old_category}'.")
        
        # Add to Office Supply
        # Check if Office Supply already exists
        cursor.execute("SELECT id FROM department_budgets WHERE department_id = ? AND category = ?", (dept_id, new_category))
        existing_new = cursor.fetchone()
        
        if existing_new:
            cursor.execute("UPDATE department_budgets SET amount = amount + ? WHERE id = ?", (amount, existing_new[0]))
            print(f" - RM {amount} ditambah kepada '{new_category}' sedia ada.")
        else:
            cursor.execute("INSERT INTO department_budgets (department_id, category, amount, year) VALUES (?, ?, ?, 2024)", (dept_id, new_category, amount))
            print(f" - RM {amount} dimasukkan ke dalam kategori '{new_category}' yang baru.")

        conn.commit()
        print("\nFix Successful! Data 'Barang Office' telah dipindahkan ke 'Office Supply'.")
        print("Sila 'Refresh' dashboard anda sekarang. 😊🚀🐢")

    except Exception as e:
        print(f"An error occurred: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_category_mismatch()
