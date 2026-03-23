import os
import time
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import logging

# Configure logging for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="Cold-Start Optimized API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,  # disable redoc to reduce memory
    openapi_url=None  # disable openapi in production
)

@app.on_event("startup")
async def startup_event():
    """Fast startup hook - runs during gunicorn preload"""
    logger.info("Starting application with preloaded resources")

@app.get("/")
async def root():
    """Root endpoint for basic health check"""
    return JSONResponse(
        content={"message": "Service ready", "uptime": time.time()},
        status_code=200
    )

@app.get("/health")
async def health_check():
    """Health check endpoint for container orchestration"""
    return JSONResponse(
        content={"status": "healthy", "timestamp": time.time()},
        status_code=200
    )

@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    return JSONResponse(
        content={
            "service": "cold-start-optimized",
            "version": "1.0.0",
            "workers": int(os.getenv('GUNICORN_WORKERS', 1)),
            "threads": int(os.getenv('GUNICORN_THREADS', 4))
        },
        status_code=200
    )
