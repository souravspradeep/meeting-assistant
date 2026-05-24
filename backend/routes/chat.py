from flask import Blueprint, request, jsonify
import requests, os
from dotenv import load_dotenv

load_dotenv()
chat_bp = Blueprint("chat", __name__)
GROQ_KEY = os.getenv("GROQ_API_KEY")

@chat_bp.route("/", methods=["POST"])
def chat():
    data = request.json
    messages = data.get("messages", [])
    transcript = data.get("transcript", "")
    meeting_data = data.get("meetingData", {})

    system = f"""You are a smart meeting assistant. Full context:

Transcript:
{transcript}

Extracted data:
{meeting_data}

Answer concisely about this specific meeting only."""

    all_messages = [{"role": "system", "content": system}] + messages

    res = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_KEY}"},
        json={
            "model": "llama-3.1-8b-instant",
            "messages": all_messages,
            "max_tokens": 1000
        }
    )
    reply = res.json()["choices"][0]["message"]["content"]
    return jsonify({"reply": reply})