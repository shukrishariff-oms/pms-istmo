from app.db.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE document_logs ADD COLUMN signed_at DATETIME"))
        conn.commit()
        print("Successfully added signed_at to document_logs")
    except Exception as e:
        print(f"Error adding column (maybe already exists?): {e}")

    try:
        conn.execute(text("ALTER TABLE document_trackers ADD COLUMN updated_at DATETIME"))
        conn.commit()
        print("Successfully added updated_at to document_trackers")
    except Exception as e:
        print(f"Error adding column: {e}")
