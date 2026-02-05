import sqlite3
import os

PATHS = [
    "storage/pms.db",
    "pms.db"
]

def check_db(path):
    if not os.path.exists(path):
        print(f"[MISSING] {path}")
        return

    print(f"[CHECKING] {path}")
    conn = sqlite3.connect(path)
    cursor = conn.cursor()
    try:
        cursor.execute("PRAGMA table_info(document_logs)")
        columns = [info[1] for info in cursor.fetchall()]
        print(f"  Columns: {columns}")
        if "signer_name" in columns and "signature_image" in columns:
            print("  => SUCCESS: Columns found.")
        else:
            print("  => FAIL: Columns MISSING.")
    except Exception as e:
        print(f"  => ERROR: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    for p in PATHS:
        check_db(p)
