# BankMate

BankMate is a full-stack, AI-powered banking assistant. Users can sign up, manage real accounts, and interact with their finances — checking balances, reviewing transactions, and managing cards — through a conversational chat interface powered by Google's Gemini function-calling API.

The core engineering focus of this project is **secure AI-to-database interaction**: the AI model never has direct access to the database. Instead, it can only *request* specific, pre-approved operations, which are validated and executed entirely by the backend.

---

## Features

- **Conversational banking assistant** — ask natural-language questions like *"what's my balance?"* or *"freeze my card"* and get real, accurate answers backed by live data
- **Secure authentication** — signup/login with hashed passwords (bcrypt) and JWT-based session tokens
- **Interactive dashboard** — real-time balance overview, spending-by-category breakdown, balance trend visualization, and transaction history
- **Manual transactions** — add or withdraw funds directly, with category tagging and custom remarks
- **Card management** — freeze/unfreeze cards through the chat assistant
- **Fully responsive, modern UI** — built with Tailwind CSS, custom animations, and a cohesive design system

---

## Architecture

```
┌──────────────────┐
│  React Frontend   │  Login · Signup · Dashboard · Chat
└────────┬──────────┘
         │ HTTPS (JWT-authenticated requests)
┌────────▼──────────┐
│  FastAPI Backend   │
│  ┌──────────────┐  │
│  │  Tool Layer  │  │  ← the only code permitted to query/modify the database
│  └──────────────┘  │
└────┬──────────┬────┘
     │          │
┌────▼───┐  ┌───▼─────────────┐
│Postgres│  │  Gemini API      │  ← decides WHICH tool to call; never executes anything itself
└────────┘  └─────────────────┘
```

**How a chat request flows:**

1. The user sends a message (e.g. *"what's my balance?"*) to the authenticated `/chat` endpoint.
2. FastAPI forwards the message, along with a list of available tool definitions, to Gemini.
3. Gemini determines whether a tool call is needed and, if so, which one and with what arguments.
4. FastAPI — never Gemini — executes the corresponding Python function against PostgreSQL.
5. The real result is sent back to Gemini, which composes a natural-language response.
6. The response is returned to the user.

This separation ensures the AI model is a *decision-maker*, not an *executor* — it can never run arbitrary queries or access data outside of the explicitly defined tool functions.

---

## Tech Stack

**Backend**
- FastAPI
- PostgreSQL + SQLAlchemy (ORM)
- Google Gemini API (function-calling)
- JWT authentication (`python-jose`) + `passlib`/`bcrypt` password hashing
- Pydantic for request/response validation

**Frontend**
- React (Vite)
- React Router
- Tailwind CSS
- Recharts (data visualization)
- react-markdown

---

## Project Structure

```
BankMate/
├── backend/
│   ├── app/
│   │   ├── database.py       # DB connection & session management
│   │   ├── models.py         # SQLAlchemy models (User, Account, Transaction, Card)
│   │   ├── tools.py          # Server-side tool layer (real DB operations)
│   │   ├── gemini_tools.py   # Tool declarations exposed to Gemini
│   │   ├── gemini_client.py  # Gemini function-calling integration
│   │   ├── auth.py           # Password hashing, JWT issuance/verification
│   │   └── main.py           # FastAPI app & route definitions
│   ├── requirements.txt
│   └── .env                  # Environment variables (not committed)
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── SignupPage.jsx
        │   ├── DashboardPage.jsx
        │   └── ChatPage.jsx
        ├── components/
        │   └── ProtectedRoute.jsx
        └── App.jsx
```

---

## Database Schema

| Table | Description |
|---|---|
| `users` | Account holders — name, email, hashed password, contact info |
| `accounts` | Bank accounts — linked to a user, holds balance, currency, account type |
| `transactions` | Transaction history — linked to an account, includes type, category, amount, merchant |
| `cards` | Debit/credit cards — linked to an account, includes status (active/frozen) |

All relationships are enforced at the database level via foreign keys.

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- A Gemini API key ([Google AI Studio](https://aistudio.google.com))

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/BankMate
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET_KEY=your_random_secret_key
```

Create the database tables:

```bash
python create_tables.py
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`, with interactive docs at `http://127.0.0.1:8000/docs`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Overview

| Endpoint | Method | Description | Auth Required |
|---|---|---|---|
| `/signup` | POST | Create a new user and starter account | No |
| `/login` | POST | Authenticate and receive a JWT | No |
| `/chat` | POST | Send a natural-language message to the AI assistant | Yes |
| `/me/accounts` | GET | Get the authenticated user's accounts | Yes |
| `/me/transactions` | GET | Get the authenticated user's transaction history | Yes |
| `/me/transact` | POST | Create a manual credit/debit transaction | Yes |

Authenticated endpoints require an `Authorization: Bearer <token>` header.

---

## Security Notes

- Passwords are never stored in plain text — only bcrypt hashes.
- JWTs are signed with a server-side secret and expire after 24 hours.
- The Gemini model has no direct database access; all operations pass through an explicit, auditable tool layer.
- `.env` files containing secrets are excluded from version control via `.gitignore`.

---

## Roadmap

- [ ] Fund transfers between accounts
- [ ] Card issuance on signup
- [ ] Spending limits and budget alerts
- [ ] Production deployment (Railway/Render + Vercel)

---

## License

This project was built for educational and portfolio purposes.
