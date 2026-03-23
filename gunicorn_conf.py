import multiprocessing
import os

# Gunicorn configuration for sub-second cold-start
bind = "0.0.0.0:8080"
workers = int(os.getenv('GUNICORN_WORKERS', 1))
threads = int(os.getenv('GUNICORN_THREADS', 4))
worker_class = "uvicorn.workers.UvicornWorker"

# Preload application for fast cold-start
preload_app = True

# Memory optimization
max_requests = int(os.getenv('GUNICORN_MAX_REQUESTS', 1000))
max_requests_jitter = int(os.getenv('GUNICORN_MAX_REQUESTS_JITTER', 100))

# Timeout settings
timeout = int(os.getenv('GUNICORN_TIMEOUT', 30))
keepalive = int(os.getenv('GUNICORN_KEEPALIVE', 2))

# Logging
accesslog = "-"
errorlog = "-"
loglevel = os.getenv('GUNICORN_LOGLEVEL', 'info')

# Process naming
proc_name = "cold-start-api"
