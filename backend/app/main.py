from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.gemini_client import chat_with_gemini #(s26)
from app.database import get_db
from app.tools import get_balance, get_transactions, freeze_card, unfreeze_card
# NEW: needed for signup/login
from app.models import User
from app.auth import hash_password, verify_password, create_access_token

app = FastAPI()


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
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    reply = chat_with_gemini(request.message, db)
    return {"reply": reply}

@app.post("/signup")
def signup(request: SignupRequest, db: Session = Depends(get_db)):

    # Step 1: check if this email is already registered
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        return {"error": "Email already registered"}

    # Step 2: create the new user — password gets hashed here, never stored raw
    new_user = User(
        full_name=request.full_name,
        email=request.email,
        phone_number=request.phone_number,
        hashed_password=hash_password(request.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # pulls the real, DB-assigned id into new_user.id

    # Step 3: auto-login — issue a real token for this brand new user
    token = create_access_token({"user_id": new_user.id})

    # Step 4: return success + token
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