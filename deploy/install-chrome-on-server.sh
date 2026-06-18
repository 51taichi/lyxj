#!/usr/bin/env bash
# Install Chromium into a reusable API image on Ubuntu 16.04 / old Docker hosts.
set -euo pipefail

API_DIR="${1:-/var/www/lyxj/apps/api}"
IMAGE="${2:-lyxj-api:chrome}"
NODE_TAG="node:20-bookworm-slim"

echo "==> Build API image with Chromium (one-time, a few minutes)"
docker rm -f lyxj-api-build 2>/dev/null || true

docker run -d --name lyxj-api-build --security-opt seccomp=unconfined \
  -v "$API_DIR:/app" \
  -w /app \
  "$NODE_TAG" \
  sleep infinity

docker exec -u root lyxj-api-build bash -c "set -eux; \
  sed -i 's|deb.debian.org|mirrors.aliyun.com|g; s|security.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
  sed -i 's|deb.debian.org|mirrors.aliyun.com|g; s|security.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list; \
  apt-get update; \
  apt-get install -y --no-install-recommends chromium; \
  command -v chromium"

docker commit lyxj-api-build "$IMAGE"
docker rm -f lyxj-api-build

echo "==> Restart API with Chromium"
docker rm -f lyxj-api 2>/dev/null || true
docker run -d \
  --security-opt seccomp=unconfined \
  --name lyxj-api \
  --restart unless-stopped \
  -p 127.0.0.1:3180:3180 \
  -v "$API_DIR:/app" \
  -w /app \
  -e API_PORT=3180 \
  -e PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
  -e PUPPETEER_SKIP_DOWNLOAD=true \
  "$IMAGE" \
  bash -c "npm start"

sleep 2
curl -s http://127.0.0.1:3180/quote/dimensions | head -c 80
echo ""
docker ps --filter name=lyxj-api
echo "==> Done. PDF/image export should work now."
