from app.db.database import engine, Base
from app.models import sql_models

print("Updating database schema...")
try:
    Base.metadata.create_all(bind=engine)
    print("Database schema updated successfully.")
except Exception as e:
    print(f"Error: {e}")
