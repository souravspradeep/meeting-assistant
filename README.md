# 🧠 AI Meeting & Workflow Assistant

> Turn raw meeting notes into structured summaries, action items, decisions, and follow-up emails — powered by Groq (free) with a Flask + MongoDB backend.

🌐 **Live Demo:** [souravspradeep.github.io/meeting-assistant](https://souravspradeep.github.io/meeting-assistant/)

## 🎬 Demo Video

[![Meeting Assistant Demo](https://img.youtube.com/vi/KhBtup5GJ_U/maxresdefault.jpg)](https://www.youtube.com/watch?v=KhBtup5GJ_U)

> Click the thumbnail above to watch the full demo

---

## ✨ Features

| Feature | Details |
|---|---|
| **Paste or upload** | Accepts pasted text, `.txt`, or `.vtt` files |
| **AI extraction** | Summary · Action items (owner + deadline) · Decisions · Key topics |
| **Dashboard** | Stats overview, tabbed result panels, participant avatars |
| **Follow-up email** | One-click AI-drafted professional email |
| **Chat** | Conversational Q&A grounded in the meeting transcript |
| **Markdown export** | Download full structured output as `.md` |
| **Meeting history** | Persistent saved meetings with search powered by MongoDB |

---

## 🏗 Architecture

```
Frontend (React)          Backend (Flask)          Database
github.io/meeting ──────► render.com/api ────────► MongoDB Atlas
    assistant                  (Groq API)
```

---

## 🎨 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 | Component-based, fast development |
| Icons | lucide-react | Lightweight, consistent |
| Styling | Inline styles + CSS variables | Zero-config, no Tailwind compiler needed |
| Backend | Flask (Python) | Lightweight, easy to deploy |
| LLM | Groq — Llama 3.1 8B Instant | 100% free, fast, reliable |
| Database | MongoDB Atlas | Free cloud database, persistent storage |
| Deployment (Frontend) | GitHub Pages + GitHub Actions | Free, automated CI/CD |
| Deployment (Backend) | Render | Free Flask hosting |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18 → [nodejs.org](https://nodejs.org)
- Python 3.8+ → [python.org](https://python.org)
- Free Groq API key → [console.groq.com](https://console.groq.com)
- Free MongoDB Atlas account → [mongodb.com/atlas](https://mongodb.com/atlas)

---

### 1. Clone the repo

```bash
git clone https://github.com/souravspradeep/meeting-assistant
cd meeting-assistant
```

---

### 2. Setup the Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```bash
GROQ_API_KEY=gsk_your-actual-key-here
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/meeting_assistant
```

Start the backend:

```bash
python app.py
```

Backend runs at `http://localhost:5001` ✅

---

### 3. Setup the Frontend

Open a new terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```bash
REACT_APP_API_BASE=http://localhost:5001/api
```

Start the frontend:

```bash
npm start
```

Frontend runs at `http://localhost:3000` ✅

---

## 🔑 Getting a Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with your email or Google account — completely free, no credit card
3. Click **API Keys** in the left menu
4. Click **Create API Key**, give it a name
5. Copy the key (starts with `gsk_...`)
6. Paste it into `backend/.env`

**Free tier limits:** 14,400 requests/day — more than enough for any team.

---

## 🍃 Setting Up MongoDB Atlas (Free)

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Sign up free
2. Create a free **M0** cluster
3. Go to **Database Access** → Add a database user
4. Go to **Network Access** → Allow access from anywhere (`0.0.0.0/0`)
5. Click **Connect** → **Drivers** → Copy the connection string
6. Replace `<password>` with your password and add `/meeting_assistant` before the `?`
7. Paste into `backend/.env` as `MONGO_URI`

---

## 📁 Project Structure

```
meeting-assistant/
├── frontend/
│   ├── src/
│   │   ├── App.js             # Full React app
│   │   └── index.js           # React entry point
│   ├── public/
│   │   └── index.html
│   ├── .env                   # REACT_APP_API_BASE (never commit)
│   ├── package.json
│   └── package-lock.json
├── backend/
│   ├── app.py                 # Flask server entry point
│   ├── routes/
│   │   ├── meetings.py        # Meeting routes (analyze, email, CRUD)
│   │   └── chat.py            # Chat route
│   ├── models/
│   │   └── meeting.py         # MongoDB model
│   ├── Procfile               # Render deployment config
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # GROQ_API_KEY + MONGO_URI (never commit)
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions CI/CD
├── .gitignore
├── README.md
├── ASSIGNEE_NOTE.md
├── sample_output.json
└── sample_transcript.txt
```

---

## 🔧 How the Backend API Works

The Flask backend exposes these endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/meetings/analyze` | Analyze transcript → save to MongoDB → return JSON |
| `GET` | `/api/meetings/` | Get all saved meetings (with optional search) |
| `GET` | `/api/meetings/<id>` | Get a single meeting by ID |
| `DELETE` | `/api/meetings/<id>` | Delete a meeting |
| `POST` | `/api/meetings/email` | Generate follow-up email |
| `POST` | `/api/chat/` | Chat with meeting data |

---

## 🚀 Deployment

### Frontend → GitHub Pages

The frontend is automatically deployed via GitHub Actions on every push to `main`.

Add this secret in GitHub → **Settings → Secrets → Actions**:

| Secret | Value |
|---|---|
| `REACT_APP_API_BASE` | `https://your-render-url.onrender.com/api` |

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --timeout 120 --workers 2`
4. Add environment variables:
   - `GROQ_API_KEY` → your Groq key
   - `MONGO_URI` → your MongoDB URI

---

## 🐛 Troubleshooting

| Error | Fix |
|---|---|
| `Processing failed` | Make sure Flask backend is running at `localhost:5001` |
| `401 Unauthorized` | Wrong Groq API key in `backend/.env` |
| `MongoDB SSL error` | Add `0.0.0.0/0` to MongoDB Atlas Network Access |
| `CORS error` | Make sure `flask-cors` is installed and `CORS(app)` is in `app.py` |
| `Gunicorn timeout` | Add `--timeout 120` to the start command in Procfile |
| `REACT_APP_API_BASE undefined` | Restart `npm start` after editing `.env` |
| App works locally but not on live site | Update `REACT_APP_API_BASE` GitHub Secret to your Render URL |

---

## 📊 Evaluation Alignment

| Criterion | Implementation |
|---|---|
| **Functionality (35%)** | All 4 core features + 4/4 bonus features (chat, persistent history, export, free LLM) |
| **UI/UX (25%)** | Dark editorial theme, stat cards, tabbed panels, avatars, drag-and-drop |
| **LLM Prompt Design (25%)** | Strict JSON schema, explicit extraction rules, separate system prompts per task |
| **Code Quality (15%)** | Component decomposition, Flask blueprints, MongoDB models, error handling, CI/CD |

---

## 📝 License

MIT