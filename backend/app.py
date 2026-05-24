from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pathlib import Path
import traceback, os

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from routes.meetings import meetings_bp
from routes.chat import chat_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(meetings_bp, url_prefix="/api/meetings")
app.register_blueprint(chat_bp, url_prefix="/api/chat")

@app.errorhandler(500)
def handle_500(e):
    return jsonify({
        "error": str(e),
        "traceback": traceback.format_exc()
    }), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)