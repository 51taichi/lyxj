#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/apps/web"
API="$ROOT/apps/api"
DIST="$WEB/dist"
DATA="$API/data"
NODE_TAG="node:20-bookworm-slim"

# Ubuntu 16.04 + old Docker: Node 20 needs relaxed seccomp on the host.
DOCKER_RUN_OPTS=(--security-opt seccomp=unconfined)

mkdir -p "$DATA/shares"

pull_node_image() {
  local mirrors=(
    "docker.m.daocloud.io/library/node:20-bookworm-slim"
    "registry.cn-hangzhou.aliyuncs.com/library/node:20-bookworm-slim"
    "node:20-bookworm-slim"
  )

  for img in "${mirrors[@]}"; do
    echo "==> Pull Node image: $img"
    if docker pull "$img"; then
      if [[ "$img" != "$NODE_TAG" ]]; then
        docker tag "$img" "$NODE_TAG"
      fi
      echo "==> Node image ready: $NODE_TAG"
      return 0
    fi
    echo "==> Failed: $img"
  done

  echo "ERROR: Could not pull Node 20 image from any mirror."
  exit 1
}

pull_node_image

echo "==> Build frontend (Node 20 container)"
docker run --rm "${DOCKER_RUN_OPTS[@]}" \
  -v "$WEB:/app" \
  -w /app \
  "$NODE_TAG" \
  bash -lc "npm ci && npm run build"

echo "==> Install API dependencies (Node 20 container)"
docker run --rm "${DOCKER_RUN_OPTS[@]}" \
  -v "$API:/app" \
  -w /app \
  -e PUPPETEER_SKIP_DOWNLOAD=true \
  "$NODE_TAG" \
  bash -lc "npm ci"

echo "==> Restart API container (no docker build on old hosts)"
docker rm -f lyxj-api 2>/dev/null || true
docker run -d "${DOCKER_RUN_OPTS[@]}" \
  --name lyxj-api \
  --restart unless-stopped \
  -p 127.0.0.1:3180:3180 \
  -v "$API:/app" \
  -w /app \
  -e API_PORT=3180 \
  -e PUPPETEER_SKIP_DOWNLOAD=true \
  "$NODE_TAG" \
  bash -lc "npm start"

echo "==> Done"
echo "Frontend: $DIST"
echo "API: http://127.0.0.1:3180"
docker ps --filter name=lyxj-api
