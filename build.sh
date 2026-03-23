set -e

echo "Building multi-stage Docker image for sub-second cold-start..."

# Build with optimization flags
docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --progress=plain \
  -t fast-coldstart-app .

# Verify image size
IMAGE_SIZE=$(docker images fast-coldstart-app --format "{{.Size}}")
echo "Image built successfully! Size: $IMAGE_SIZE"

# Test cold-start time
echo "Testing cold-start performance..."
docker run --rm -d --name test-container -p 8080:8080 fast-coldstart-app
sleep 2

# Wait for health check
start_time=$(date +%s)
while ! curl -f http://localhost:8080/health > /dev/null 2>&1; do
  if [ $(($(date +%s) - start_time)) -gt 10 ]; then
    echo "ERROR: Container failed to start within 10 seconds"
    docker stop test-container
    exit 1
  fi
  sleep 0.5
done
end_time=$(date +%s)
cold_start=$((end_time - start_time))

echo "Cold-start completed in ${cold_start}s"
docker stop test-container

echo ""
echo "Build complete! Run the following to start:"
echo "docker-compose up -d"
echo "# or"
echo "docker run -p 8080:8080 fast-coldstart-app"
