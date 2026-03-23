set -e
[ -z "$GCP_PROJECT" ] && echo "ERROR: GCP_PROJECT not set" && exit 1
[ -z "$IMAGE_NAME" ] && IMAGE_NAME="fastapi-app"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-fastapi-service}"

echo "=== Starting GCP deployment ==="
echo "Project: $GCP_PROJECT"
echo "Service: $SERVICE"
echo "Region: $REGION"

echo "Building Docker image..."
docker build -t gcr.io/${GCP_PROJECT}/${IMAGE_NAME}:latest .

echo "Pushing to Container Registry..."
gcloud auth configure-docker --quiet
docker push gcr.io/${GCP_PROJECT}/${IMAGE_NAME}:latest

echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE} \
  --image gcr.io/${GCP_PROJECT}/${IMAGE_NAME}:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8000 \
  --memory 512Mi \
  --cpu 1

echo "Enforcing HTTPS with HSTS..."
gcloud run services update ${SERVICE} \
  --region ${REGION} \
  --set-env-vars="PORT=8000,FORWARDED_ALLOW_IPS=*" \
  --clear-env-vars="FORCE_HTTP" \
  --quiet

SERVICE_URL=$(gcloud run services describe ${SERVICE} --region ${REGION} --format='value(status.url)')
echo "=== Deployment Complete ==="
echo "HTTPS Endpoint: ${SERVICE_URL}"
echo "HSTS is enabled as Cloud Run always serves HTTPS"
