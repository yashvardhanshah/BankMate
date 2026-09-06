from app.database import SessionLocal
from app.tools import get_balance, get_transactions, freeze_card, unfreeze_card

db = SessionLocal()

print("Balance:", get_balance(db, "1234567890"))
print("Transactions:", get_transactions(db, "1234567890"))
print("Freeze card:", freeze_card(db, "4521"))
print("Unfreeze card:", unfreeze_card(db, "4521"))

db.close()