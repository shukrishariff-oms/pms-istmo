from app.db.database import SessionLocal
from app.models import sql_models

db = SessionLocal()
docs = db.query(sql_models.DocumentTracker).all()
print(f"Total documents: {len(docs)}")
for d in docs:
    print(f"ID: {d.id} | Title: {d.title} | Ref: {repr(d.ref_number)} | Holder: {d.current_holder}")
db.close()
