import os
import logging
from flask import Flask, render_template, jsonify

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Config
FLASK_ENV = os.getenv('FLASK_ENV', 'production')
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 8080))

@app.route('/')
def index():
    """Serve the landing page."""
    try:
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Error serving index: {str(e)}")
        return "Internal Server Error", 500

@app.route('/healthz')
def healthz():
    """Health check endpoint for Cloud Run."""
    return jsonify({'status': 'healthy'}), 200

@app.errorhandler(404)
def not_found(error):
    """Fallback for all unmatched routes."""
    logger.info(f"404 for {request.path}")
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors gracefully."""
    logger.error(f"500 error: {str(error)}")
    return "Internal Server Error", 500

if __name__ == '__main__':
    app.run(host=HOST, port=PORT, debug=(FLASK_ENV == 'development'))
