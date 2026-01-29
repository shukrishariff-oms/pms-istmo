import os
import shutil
from datetime import datetime

def backup_database():
    # 1. Tentukan path database yang asal
    # backend/app/db/database.py -> storage/pms.db
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "storage", "pms.db")
    
    # 2. Tentukan folder backup
    backup_dir = os.path.join(base_dir, "storage", "backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    # 3. Buat nama fail dengan timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"pms_backup_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_filename)
    
    # 4. Lakukan salinan (copy)
    if os.path.exists(db_path):
        try:
            shutil.copy2(db_path, backup_path)
            print(f"✅ Backup Berjaya: {backup_filename}")
            print(f"📍 Lokasi: {backup_path}")
        except Exception as e:
            print(f"❌ Ralat Backup: {e}")
    else:
        print(f"⚠️ Ralat: Fail database tidak dijumpai di {db_path}")

if __name__ == "__main__":
    backup_database()
