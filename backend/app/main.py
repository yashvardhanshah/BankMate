from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import random
from app.models import Account
from app.gemini_client import chat_with_gemini #(s26)
from app.database import get_db
from app.tools import get_balance, get_transactions, freeze_card, unfreeze_card
# NEW: needed for signup/login
from app.models import User
from app.auth import hash_password, verify_password, create_access_token
from app.auth import get_current_user

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AccountRequest(BaseModel):
    account_number: str


class TransactionsRequest(BaseModel):
    account_number: str
    limit: int = 5


class CardRequest(BaseModel):
    card_number_last4: str

# What data /signup expects: name, email, password required. phone optional.
class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str
    phone_number: str = None


# What data /login expects: just email + password.
class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/balance")
def balance_endpoint(request: AccountRequest, db: Session = Depends(get_db)):
    return get_balance(db, request.account_number)


@app.post("/transactions")
def transactions_endpoint(request: TransactionsRequest, db: Session = Depends(get_db)):
    return get_transactions(db, request.account_number, request.limit)


@app.post("/freeze-card")
def freeze_card_endpoint(request: CardRequest, db: Session = Depends(get_db)):
    return freeze_card(db, request.card_number_last4)


@app.post("/unfreeze-card")
def unfreeze_card_endpoint(request: CardRequest, db: Session = Depends(get_db)):
    return unfreeze_card(db, request.card_number_last4)

class ChatRequest(BaseModel):
    message: str

#check notes (s26)
@app.post("/chat")
def chat_endpoint(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get the current user's real account (from their token, not guessed)
    account_number = current_user.accounts[0].account_number if current_user.accounts else None

    # Include the real account number in the message sent to Gemini,
    # so it doesn't need to ask for it or guess it
    message_with_context = f"{request.message} (My account number is {account_number})"

    reply = chat_with_gemini(message_with_context, db)
    return {"reply": reply}


def generate_account_number():
    return str(random.randint(1000000000, 9999999999))

@app.post("/signup")
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        return {"error": "Email already registered"}

    new_user = User(
        full_name=request.full_name,
        email=request.email,
        phone_number=request.phone_number,
        hashed_password=hash_password(request.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # NEW: automatically create a starter checking account for this new user
    new_account = Account(
        user=new_user,
        account_number=generate_account_number(),
        account_type="checking",
        balance=0.0,
        currency="INR"
    )
    db.add(new_account)
    db.commit()

    token = create_access_token({"user_id": new_user.id})

    return {
        "message": "Signup successful",
        "access_token": token,
        "token_type": "bearer"
    }


@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):

    # Step 1: look up the user by email
    user = db.query(User).filter(User.email == request.email).first()

    # Step 2: check user exists AND password matches the stored hash
    # (same generic error either way, so attackers can't tell which part failed)
    if not user or not verify_password(request.password, user.hashed_password):
        return {"error": "Invalid email or password"}

    # Step 3: credentials correct — issue a real token for this existing user
    token = create_access_token({"user_id": user.id})

    # Step 4: return success + token
    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer"
    }

@app.get("/me/accounts")
def get_my_accounts(current_user: User = Depends(get_current_user)):
    accounts_data = []
    for account in current_user.accounts:
        accounts_data.append({
            "account_number": account.account_number,
            "account_type": account.account_type,
            "balance": account.balance,
            "currency": account.currency
        })

    return {
        "full_name": current_user.full_name,
        "accounts": accounts_data
    }

@app.get("/me/transactions")
def get_my_transactions(current_user: User = Depends(get_current_user), limit: int = 5):
    all_transactions = []
    for account in current_user.accounts:
        for t in sorted(account.transactions, key=lambda x: x.created_at, reverse=True)[:limit]:
            all_transactions.append({
                "account_number": account.account_number,
                "type": t.transaction_type,
                "category": t.category,
                "amount": t.amount,
                "description": t.description,
                "merchant": t.merchant,
                "date": t.created_at.isoformat() if t.created_at else None
            })

    return {"transactions": all_transactions}