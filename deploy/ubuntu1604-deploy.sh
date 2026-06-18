#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/apps/web"
API="$ROOT/apps/api"
DIST="$WEB/dist"
DATA="$API/data"

mkdir -p "$DATA/shares"

echo "==> Build frontend (Node 20 container)"
docker run --rm \
  -v "$WEB:/app" \
  -w /app \
  node:20-bookworm-slim \
  bash -lc "npm ci && npm run build"

echo "==> Build API image"
docker build -t lyxj-api "$API"

echo "==> Restart API container"
docker rm -f lyxj-api 2>/dev/null || true
docker run -d \
  --name lyxj-api \
  --restart unless-stopped \
  -p 127.0.0.1:3180:3180 \
  -v "$DATA:/app/data" \
  lyxj-api

echo "==> Done"
echo "Frontend: $DIST"
echo "API: http://127.0.0.1:3180"
docker ps --filter name=lyxj-api
