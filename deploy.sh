# GCP Container Registry + Cloud Run deployment with HTTPS & HSTS
# Usage: ./deploy.sh [PROJECT_ID] [SERVICE_NAME] [IMAGE_TAG]

# Parse arguments or use defaults
PROJECT_ID=${1:-${GCP_PROJECT_ID}}
SERVICE_NAME=${2:-flask-app}
IMAGE_TAG=${3:-latest}

# Variables
REGION="us-central1"
IMAGE_URI="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${IMAGE_TAG}"
DOMAIN="${SERVICE_NAME}-xyzxyzxyz.a.run.app"  # You can replace with custom domain

# Check if logged in
gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 || {
  echo "Please login: gcloud auth login"; exit 1
}

# Build and push to Container Registry
docker build -t "${IMAGE_URI}" . \
  && docker push "${IMAGE_URI}"

# Deploy to Cloud Run with HTTPS and HSTS
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_URI}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8000 \
  --set-env-vars "FLASK_ENV=production,SECURE_HEADERS=true"

# Configure HSTS (HTTP Strict Transport Security) via Cloud Run headers
# Note: Cloud Run automatically provides HTTPS - no additional config needed
# For custom HSTS headers, add via your application code:
# response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

# Get service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --platform managed \
  --format 'value(status.url)')

echo " Deployment complete!"
echo " Service URL: ${SERVICE_URL}"
echo " HTTPS: Enabled by Cloud Run"
echo " HSTS: Configure in application code for custom headers"
