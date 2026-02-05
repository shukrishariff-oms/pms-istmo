import sqlite3
import os

DB_PATH = "storage/pms.db"

def migrate_documents():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print(f"Migrating document_logs table in: {DB_PATH}...")

    # Check and add signer_name
    try:
        cursor.execute("SELECT signer_name FROM document_logs LIMIT 1")
    except sqlite3.OperationalError:
        print("Adding signer_name column...")
        cursor.execute("ALTER TABLE document_logs ADD COLUMN signer_name TEXT")
    else:
        print("signer_name column already exists.")

    # Check and add signature_image
    try:
        cursor.execute("SELECT signature_image FROM document_logs LIMIT 1")
    except sqlite3.OperationalError:
        print("Adding signature_image column...")
        cursor.execute("ALTER TABLE document_logs ADD COLUMN signature_image TEXT")
    else:
        print("signature_image column already exists.")

    conn.commit()
    conn.close()
    print("Document logs migration successful.")

if __name__ == "__main__":
    migrate_documents()
