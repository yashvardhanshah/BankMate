from app.database import SessionLocal
from app.gemini_client import chat_with_gemini

db = SessionLocal()
answer = chat_with_gemini("Unfreeze card 4521 please", db)
print(answer)
db.close()