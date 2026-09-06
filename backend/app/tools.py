from sqlalchemy.orm import Session
from app.models import Account, Transaction, Card


def get_balance(db: Session, account_number: str):
    account = db.query(Account).filter(Account.account_number == account_number).first()

    if not account:
        return {"error": "Account not found"}

    return {
        "account_number": account.account_number,
        "account_type": account.account_type,
        "balance": account.balance,
        "currency": account.currency
    }


def get_transactions(db: Session, account_number: str, limit: int = 5):
    account = db.query(Account).filter(Account.account_number == account_number).first()

    if not account:
        return {"error": "Account not found"}

    transactions = (
        db.query(Transaction)
        .filter(Transaction.account_id == account.id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "account_number": account.account_number,
        "transactions": [
            {
                "type": t.transaction_type,
                "category": t.category,
                "amount": t.amount,
                "description": t.description,
                "merchant": t.merchant,
                "date": t.created_at.isoformat() if t.created_at else None
            }
            for t in transactions
        ]
    }


def freeze_card(db: Session, card_number_last4: str):
    card = db.query(Card).filter(Card.card_number_last4 == card_number_last4).first()

    if not card:
        return {"error": "Card not found"}

    card.status = "frozen"
    db.commit()
    db.refresh(card)

    return {
        "card_number_last4": card.card_number_last4,
        "status": card.status
    }


def unfreeze_card(db: Session, card_number_last4: str):
    card = db.query(Card).filter(Card.card_number_last4 == card_number_last4).first()

    if not card:
        return {"error": "Card not found"}

    card.status = "active"
    db.commit()
    db.refresh(card)

    return {
        "card_number_last4": card.card_number_last4,
        "status": card.status
    }