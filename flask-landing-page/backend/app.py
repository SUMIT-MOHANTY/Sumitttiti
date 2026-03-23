import os
import logging
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "message": "Flask app is running"}), 200

@app.route('/api/echo', methods=['POST'])
def echo():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        message = data.get('message', '')
        return jsonify({"echo": message, "status": "success"}), 200
    except Exception as e:
        logging.error(f"API error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
