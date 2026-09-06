from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.gemini_client import chat_with_gemini #(s26)
from app.database import get_db
from app.tools import get_balance, get_transactions, freeze_card, unfreeze_card

app = FastAPI()


class AccountRequest(BaseModel):
    account_number: str


class TransactionsRequest(BaseModel):
    account_number: str
    limit: int = 5


class CardRequest(BaseModel):
    card_number_last4: str


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