from fastapi import FastAPI
import logging

# Configure logging for startup performance
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app with minimal configuration
app = FastAPI(
    title="Fast Cold-Start API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None  # Disable redoc for faster startup
)

@app.on_event("startup")
async def startup_event():
    """Minimal startup logic for cold-start optimization"""
    logger.info("Application starting up...")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Hello World!"}

@app.get("/health")
async def health():
    """Health endpoint for monitoring"""
    return {"status": "ok", "timestamp": __import__('time').time()}

# For direct testing without gunicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
