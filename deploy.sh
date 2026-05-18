#!/bin/bash
set -e

echo "=== Betika Deployment Script ==="

# Pull latest code (if using git)
if [ -d ".git" ]; then
  echo "→ Pulling latest code..."
  git pull origin main
fi

# Build and restart containers
echo "→ Building and starting containers..."
docker compose down
docker compose up -d --build

# Show status
echo "→ Container status:"
docker compose ps

echo ""
echo "✅ Deployment complete — app running at http://41.191.225.34:8080"
