from database import SessionLocal
from models import User
from auth import hash_password

db = SessionLocal()

admin = db.query(User).filter(User.id == 1).first()

if admin:
    admin.password = hash_password("Admin@12345")
    db.commit()
    print("Admin password reset successfully!")
else:
    print("Admin user not found!")

db.close()