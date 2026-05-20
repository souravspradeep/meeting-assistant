# 🧠 AI Meeting & Workflow Assistant

> Turn raw meeting notes into structured summaries, action items, decisions, and follow-up emails — powered by Groq (free).

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
| **Meeting history** | In-session saved meetings with search |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18 → download at [nodejs.org](https://nodejs.org)
- A free Groq API key → get one at [console.groq.com](https://console.groq.com) (no credit card needed)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/meeting-assistant
cd meeting-assistant
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your Groq API key

Create a `.env` file in the root folder:

```bash
REACT_APP_GROQ_KEY=gsk_your-actual-key-here
```

### 4. Start the app

```bash
npm start
```

The app opens at `http://localhost:3000`. Click **"Try sample"** then **"Analyze Meeting"** to test it.

---

## 🔑 Getting a Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with your email or Google account — completely free, no credit card
3. Click **API Keys** in the left menu
4. Click **Create API Key**, give it a name
5. Copy the key (starts with `gsk_...`)
6. Paste it into your `.env` file as shown above

**Free tier limits:** 14,400 requests/day — more than enough for any team.

---

## 🛠 Running from Scratch (Beginner Setup)

If you don't have an existing React project:

```bash
# 1. Create a new React app
npx create-react-app meeting-assistant
cd meeting-assistant

# 2. Install the icon library
npm install lucide-react

# 3. Replace the default App file
cp MeetingAssistant.jsx src/App.jsx

# 4. Replace src/index.js with this:
```

```js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

```bash
# 5. Create your .env file
echo "REACT_APP_GROQ_KEY=gsk_your-key-here" > .env

# 6. Start
npm start
```

---

## 🔧 How the API is Set Up

The app calls Groq's API which is OpenAI-compatible. Here's the core function:

```js
// src/App.jsx
async function callClaude(messages, system) {
  const allMessages = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.REACT_APP_GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: allMessages,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) throw new Error("API " + res.status);
  const d = await res.json();
  return d.choices[0].message.content;
}
```

> ⚠️ Never expose API keys in production client-side code. Use a backend proxy (see below).

---

## 🔧 Backend Proxy (Optional — Recommended for Production)

For a deployed public app, keep your API key server-side using a simple Flask proxy:

```bash
pip install flask requests python-dotenv
```

```python
# server.py
from flask import Flask, request, jsonify
import os, requests
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
GROQ_KEY = os.getenv("GROQ_API_KEY")

@app.route("/api/chat", methods=["POST"])
def chat():
    body = request.json
    system = body.get("system", "")
    messages = body["messages"]
    all_messages = ([{"role": "system", "content": system}] + messages) if system else messages

    res = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_KEY}"},
        json={
            "model": "llama-3.1-8b-instant",
            "messages": all_messages,
            "max_tokens": 1000
        }
    )
    return jsonify({"text": res.json()["choices"][0]["message"]["content"]})

if __name__ == "__main__":
    app.run(port=5001)
```

```bash
# .env (server side)
GROQ_API_KEY=gsk_your-actual-key-here
```

Then update the fetch URL in `App.jsx`:
```js
const res = await fetch("http://localhost:5001/api/chat", { ... });
```

---

## 📁 Project Structure

```
meeting-assistant/
├── src/
│   ├── App.jsx                # Full React app (single file)
│   └── index.js               # React entry point
├── public/
│   └── index.html
├── .env                       # Your Groq API key (never commit this)
├── .gitignore                 # .env is listed here
├── README.md
├── ASSIGNEE_NOTE.md           # Note on assignee extraction handling
├── sample_output.json         # Example structured JSON output
├── sample_transcript.txt      # Demo meeting transcript
└── package.json
```

---

## 🎨 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 (single file) | Simple, no extra config needed |
| Icons | lucide-react | Lightweight, consistent |
| Styling | Inline styles + CSS variables | Zero-config, works without Tailwind compiler |
| LLM | Groq — Llama 3.1 8B Instant | 100% free, fast, reliable |
| Storage | Component state (in-session) | No backend needed for MVP |

---

## 🚀 Deploy to GitHub Pages

### 1. Install deploy tool
```bash
npm install --save-dev gh-pages
```

### 2. Update `package.json`

Add `homepage` near the top:
```json
"homepage": "https://YOUR_USERNAME.github.io/meeting-assistant",
```

Add two lines inside `"scripts"`:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build",
  "start": "react-scripts start",
  "build": "react-scripts build"
}
```

### 3. Add your key as a GitHub Secret

Since `.env` is never uploaded to GitHub, add your key as a secret:

1. Go to your repo → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `REACT_APP_GROQ_KEY`
4. Value: your actual `gsk_...` key
5. Click **Add secret**

### 4. Create `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          REACT_APP_GROQ_KEY: ${{ secrets.REACT_APP_GROQ_KEY }}

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
```

### 5. Deploy
```bash
npm run deploy
```

Your app goes live at `https://YOUR_USERNAME.github.io/meeting-assistant` 🎉

---

## 🐛 Troubleshooting

| Error | Fix |
|---|---|
| `REACT_APP_GROQ_KEY is undefined` | Make sure `.env` is in the root folder, not inside `src/`. Restart `npm start` after editing it. |
| `401 Unauthorized` | Wrong API key. Go to console.groq.com, create a new key and paste it carefully. |
| `400 Bad Request` | Model name is wrong. Make sure it says exactly `llama-3.1-8b-instant`. |
| JSON parse error | The model added extra text around JSON. The `replace()` call in the code handles this — make sure it's there. |
| App works locally but not on GitHub Pages | Your `.env` file isn't uploaded. Use the GitHub Secrets + Actions workflow above. |

---

## 📊 Evaluation Alignment

| Criterion | Implementation |
|---|---|
| **Functionality (35%)** | All 4 core features + 4/4 bonus features (chat, history, export, free LLM) |
| **UI/UX (25%)** | Dark editorial theme, stat cards, tabbed panels, avatars, drag-and-drop |
| **LLM Prompt Design (25%)** | Strict JSON schema, explicit extraction rules, separate system prompts per task |
| **Code Quality (15%)** | Component decomposition, error handling, loading states, consistent design tokens |

---

## 📝 License

MIT