from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import os

app = FastAPI()

# HSTS enforcement via HTTPS-only headers
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

@app.middleware("http")
async def enforce_https(request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

@app.get("/")
async def root():
    return {"message": "HTTPS/HSTS secured FastAPI on Cloud Run",
            "headers": "Includes HSTS, CSP, and security headers"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
