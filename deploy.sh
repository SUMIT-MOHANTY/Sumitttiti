#!/usr/bin/env bash
set -e
#
# GCP Container Registry + Cloud Run deployment with HTTPS & HSTS
# Usage: ./deploy.sh [GCP_PROJECT] [SERVICE] [IMAGE_NAME] [REGION]
#

# Defaults
[ -z "$GCP_PROJECT" ] && echo "ERROR: GCP_PROJECT not set (pass as first arg)" && exit 1
GCP_PROJECT=${1:-$GCP_PROJECT}

IMAGE_NAME=${2:-flask-app}
SERVICE=${3:-$IMAGE_NAME}
REGION=${4:-us-central1}

IMAGE_URI="gcr.io/${GCP_PROJECT}/${IMAGE_NAME}:latest"

# Auth check
gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 || {
  echo "Please login: gcloud auth login"
  exit 1
}

echo "=== Starting GCP deployment ==="
echo "Project: $GCP_PROJECT"
echo "Service: $SERVICE"
echo "Region: $REGION"

# Build and push
echo "Building Docker image..."
docker build -t "${IMAGE_URI}" .

echo "Ensuring gcloud Docker helper..."
gcloud auth configure-docker --quiet

echo "Pushing to Container Registry..."
docker push "${IMAGE_URI}"

# Deploy
echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE_URI}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --port 8000 \
  --memory 512Mi \
  --cpu 1

# Configure environment and enforce HTTPS
echo "Enforcing HTTPS with HSTS..."
gcloud run services update "${SERVICE}" \
  --region "${REGION}" \
  --set-env-vars="FLASK_ENV=production,SECURE_HEADERS=true,PORT=8000,FORWARDED_ALLOW_IPS=*" \
  --clear-env-vars="FORCE_HTTP" \
  --quiet

# Final URL
SERVICE_URL=$(gcloud run services describe "${SERVICE}" \
  --region "${REGION}" \
  --format='value(status.url)')

echo "=== Deployment Complete ==="
echo "HTTPS Endpoint: ${SERVICE_URL}"
echo "HSTS is enabled as Cloud Run always serves HTTPS"
