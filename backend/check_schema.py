from app.db.database import engine
from sqlalchemy import inspect

inspector = inspect(engine)
columns = inspector.get_columns('document_logs')
print("Columns in document_logs:")
for c in columns:
    print(f"- {c['name']} ({c['type']})")
