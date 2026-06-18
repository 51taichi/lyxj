#!/usr/bin/env bash
# Run on your Mac when the Ubuntu 16.04 server cannot build inside Docker.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER="${1:?Usage: bash deploy/mac-build-and-upload.sh root@YOUR_SERVER_IP}"

echo "==> Build frontend on Mac"
cd "$ROOT/apps/web"
npm ci
npm run build

echo "==> Build API image on Mac"
cd "$ROOT/apps/api"
docker build -t lyxj-api .
docker save lyxj-api:latest | gzip > /tmp/lyxj-api.tar.gz

echo "==> Upload to server"
ssh "$SERVER" "mkdir -p /var/www/lyxj/apps/web /var/www/lyxj/apps/api/data/shares"
scp -r "$ROOT/apps/web/dist" "$SERVER:/var/www/lyxj/apps/web/"
scp /tmp/lyxj-api.tar.gz "$SERVER:/tmp/lyxj-api.tar.gz"
scp "$ROOT/deploy/nginx-lyxj.conf" "$SERVER:/tmp/nginx-lyxj.conf"

echo "==> Load and start API on server"
ssh "$SERVER" bash -s <<'REMOTE'
set -euo pipefail
docker load -i /tmp/lyxj-api.tar.gz
docker rm -f lyxj-api 2>/dev/null || true
docker run -d \
  --security-opt seccomp=unconfined \
  --name lyxj-api \
  --restart unless-stopped \
  -p 127.0.0.1:3180:3180 \
  -v /var/www/lyxj/apps/api/data:/app/data \
  lyxj-api:latest
curl -s http://127.0.0.1:3180/quote/dimensions | head -c 120
echo ""
REMOTE

echo "==> Done. Configure nginx on the server if you have not already."
