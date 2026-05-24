from flask import Blueprint, request, jsonify
from models.meeting import save_meeting, get_all_meetings, get_meeting_by_id, delete_meeting_by_id
import requests, os, json, re
from dotenv import load_dotenv

load_dotenv()
meetings_bp = Blueprint("meetings", __name__)
GROQ_KEY = os.getenv("GROQ_API_KEY")

EXTRACT_SYSTEM = """You are a precise meeting analyst. Return ONLY valid JSON (no markdown):
{
  "meeting_title": "concise title",
  "meeting_date": "date or null",
  "participants": ["name1"],
  "summary": "3-4 sentence overview",
  "action_items": [{"description":"task","assignee":"Name or Unassigned","deadline":"or null"}],
  "decisions": ["decision"],
  "key_topics": ["topic1","topic2"]
}
Assignee rules: extract from 'John will...', 'Sarah to...', '@alice'. No clear owner means Unassigned."""

EMAIL_SYSTEM = "You are a professional business writer. Write a crisp follow-up email. Format: Subject: [subject]\n\n[body under 200 words]"


def call_groq(messages, system):
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
    return res.json()["choices"][0]["message"]["content"]


# ── SPECIFIC ROUTES FIRST ─────────────────────────────────────────────────────

@meetings_bp.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    transcript = data.get("transcript", "")

    if not transcript:
        return jsonify({"error": "No transcript provided"}), 400

    try:
        raw = call_groq(
            [{"role": "user", "content": f"Analyze this meeting:\n\n{transcript}"}],
            EXTRACT_SYSTEM
        )
        cleaned = re.sub(r"```json\n?|\n?```", "", raw).strip()
        parsed = json.loads(cleaned)

        # Save to MongoDB
        meeting_id = save_meeting(parsed, transcript)
        parsed["_id"] = str(meeting_id)

        return jsonify(parsed)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@meetings_bp.route("/email", methods=["POST"])
def generate_email():
    data = request.json
    meeting = data.get("meeting")

    prompt = f"""Meeting: {meeting['meeting_title']}
Summary: {meeting['summary']}
Action items: {', '.join([f"{a['description']} ({a['assignee']}{', due ' + a['deadline'] if a['deadline'] else ''})" for a in meeting['action_items']])}
Decisions: {', '.join(meeting['decisions'])}
Write a professional follow-up email."""

    email = call_groq([{"role": "user", "content": prompt}], EMAIL_SYSTEM)
    return jsonify({"email": email})


@meetings_bp.route("/", methods=["GET"])
def get_meetings():
    query = request.args.get("q", "")
    meetings = get_all_meetings(query)
    return jsonify(meetings)


# ── DYNAMIC ROUTES LAST ───────────────────────────────────────────────────────

@meetings_bp.route("/<string:meeting_id>", methods=["GET"])
def get_meeting(meeting_id):
    meeting = get_meeting_by_id(meeting_id)
    if not meeting:
        return jsonify({"error": "Meeting not found"}), 404
    return jsonify(meeting)


@meetings_bp.route("/<string:meeting_id>", methods=["DELETE"])
def delete_meeting(meeting_id):
    delete_meeting_by_id(meeting_id)
    return jsonify({"message": "Deleted"})