"""FastAPI application optimized for cold-start performance."""
import os
import asyncio
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging

# Configure logging for faster startup
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Global app instance
app: Optional[FastAPI] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan for efficient startup."""
    logger.info("Starting FastAPI application...")
    yield
    logger.info("Shutting down FastAPI application...")

# Create app with optimized settings
app = FastAPI(
    title="Cold-Start API",
    version="1.0.0",
    docs_url=None,  # Disable docs for faster startup
    redoc_url=None,  # Disable redoc for faster startup
    lifespan=lifespan
)

class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    startup_time: float

class SimpleResponse(BaseModel):
    """Simple API response."""
    message: str
    version: str

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for sub-second validation."""
    import time
    return HealthResponse(
        status="healthy",
        startup_time=time.time()
    )

@app.get("/", response_model=SimpleResponse)
async def root():
    """Root endpoint for basic testing."""
    return SimpleResponse(
        message="API is running",
        version="1.0.0"
    )

@app.get("/api/ready")
async def readiness_check():
    """Kubernetes readiness check endpoint."""
    return {"ready": True}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="warning",
        access_log=False
    )
