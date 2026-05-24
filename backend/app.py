from flask import Flask, jsonify
from flask_cors import CORS
from routes.meetings import meetings_bp
from routes.chat import chat_bp
import traceback

app = Flask(__name__)
CORS(app)

app.register_blueprint(meetings_bp, url_prefix="/api/meetings")
app.register_blueprint(chat_bp, url_prefix="/api/chat")

# This shows full error details in the response
@app.errorhandler(500)
def handle_500(e):
    return jsonify({
        "error": str(e),
        "traceback": traceback.format_exc()
    }), 500

if __name__ == "__main__":
    app.run(port=5001, debug=True)