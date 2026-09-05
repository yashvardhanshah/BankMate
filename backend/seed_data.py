from datetime import datetime
from app.database import SessionLocal
from app.models import User, Account, Transaction, Card

db = SessionLocal()

# 1. Create a user
user = User(
    full_name="Yashvardhan Shah",
    email="yash@example.com",
    phone_number="9876543210",
    date_of_birth=datetime(2000, 1, 15)
)
db.add(user)
db.commit()
db.refresh(user)

# 2. Create two accounts for this user
checking = Account(
    user=user,
    account_number="1234567890",
    account_type="checking",
    balance=45230.75,
    currency="INR"
)
savings = Account(
    user=user,
    account_number="9876543210",
    account_type="savings",
    balance=152000.00,
    currency="INR"
)
db.add_all([checking, savings])
db.commit()
db.refresh(checking)
db.refresh(savings)

# 3. Create transactions
txn1 = Transaction(
    account=checking,
    transaction_type="debit",
    category="groceries",
    amount=1250.50,
    description="Grocery shopping",
    merchant="BigBasket"
)
txn2 = Transaction(
    account=checking,
    transaction_type="credit",
    category="salary",
    amount=65000.00,
    description="Monthly salary",
    merchant="Employer Inc"
)
txn3 = Transaction(
    account=savings,
    transaction_type="debit",
    category="transfer",
    amount=5000.00,
    description="Transfer to checking"
)
db.add_all([txn1, txn2, txn3])
db.commit()

# 4. Create cards
card1 = Card(
    account=checking,
    card_number_last4="4521",
    card_type="debit",
    expiry_date=datetime(2029, 6, 30)
)
card2 = Card(
    account=savings,
    card_number_last4="7890",
    card_type="debit",
    expiry_date=datetime(2028, 3, 31)
)
db.add_all([card1, card2])
db.commit()

print("✅ Seed data created successfully!")

db.close()