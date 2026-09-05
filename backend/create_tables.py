from app.database import engine, Base
from app.models import User, Account, Transaction, Card

Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully!")