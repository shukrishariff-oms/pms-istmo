from app.db.database import SessionLocal
from app.models import sql_models as models

def seed_categories():
    db = SessionLocal()
    try:
        defaults = ['General', 'Kitchen Supply', 'Office Supply', 'Maintenance', 'Training', 'Utilities']
        
        for name in defaults:
            existing = db.query(models.FinanceCategory).filter(models.FinanceCategory.name == name).first()
            if not existing:
                print(f"Adding category: {name}")
                db.add(models.FinanceCategory(name=name))
        
        db.commit()
        print("Seeding completed successfully!")
    except Exception as e:
        print(f"Error seeding categories: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_categories()
