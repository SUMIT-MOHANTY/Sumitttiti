set -e

echo "Building optimized Docker image for sub-second cold-start..."

# Build with buildkit for better caching
DOCKER_BUILDKIT=1 docker build -t cold-start-api:latest .

# Test cold-start time
echo "Testing cold-start performance..."
start_time=$(date +%s%3N)
container_id=$(docker run -d -p 8080:8080 cold-start-api:latest)

# Wait for startup and health check
for i in {1..10}; do
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        end_time=$(date +%s%3N)
        startup_time=$((end_time - start_time))
        echo " Cold-start completed in ${startup_time}ms"
        break
    fi
    if [ "$i" -eq 10 ]; then
        echo " Service failed to start within timeout"
        docker logs "$container_id"
        docker stop "$container_id"
        exit 1
    fi
    sleep 0.5
done

# Test endpoints
echo "Testing API endpoints..."
curl -f http://localhost:8080/api/status | jq .

# Cleanup
docker stop "$container_id"
echo "Build test completed successfully!"
