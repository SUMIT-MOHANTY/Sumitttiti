"""Optimized gunicorn configuration for sub-second cold-start."""
import multiprocessing
import os

# Network configuration
bind = f"0.0.0.0:{os.getenv('PORT', '8080')}"
backlog = 2048

# Worker configuration
workers = min(2, multiprocessing.cpu_count() * 2 + 1)
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2

# Preload for faster worker startup
preload_app = True

# Logging configuration
accesslog = None
errorlog = "-"  # Log to stdout
loglevel = os.getenv("LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'fastapi-app'

# Server mechanics
daemon = False
pidfile = None
user = None
group = None
tmp_upload_dir = None

# SSL (disabled for performance)
keyfile = None
certfile = None
