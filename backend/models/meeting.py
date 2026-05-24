from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

client = MongoClient(
    os.getenv("MONGO_URI"),
    tls=True,
    tlsAllowInvalidCertificates=True,
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=30000,
    socketTimeoutMS=30000
)
db = client["meeting_assistant"]
collection = db["meetings"]


def save_meeting(data, transcript):
    data["transcript"] = transcript
    data["created_at"] = datetime.utcnow()
    result = collection.insert_one(data)
    return result.inserted_id


def get_all_meetings(query=""):
    filter = {}
    if query:
        filter = {
            "$or": [
                {"meeting_title": {"$regex": query, "$options": "i"}},
                {"summary": {"$regex": query, "$options": "i"}},
            ]
        }
    meetings = list(collection.find(filter).sort("created_at", -1))
    for m in meetings:
        m["_id"] = str(m["_id"])
    return meetings


def get_meeting_by_id(meeting_id):
    try:
        meeting = collection.find_one({"_id": ObjectId(meeting_id)})
        if meeting:
            meeting["_id"] = str(meeting["_id"])
        return meeting
    except Exception:
        return None


def delete_meeting_by_id(meeting_id):
    try:
        collection.delete_one({"_id": ObjectId(meeting_id)})
    except Exception:
        pass