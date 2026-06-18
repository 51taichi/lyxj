FROM node:20-bookworm-slim

WORKDIR /app

# better-sqlite3 + Puppeteer/Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    chromium \
    fonts-liberation \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV API_PORT=3180

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN mkdir -p data/shares

EXPOSE 3180

CMD ["npm", "start"]
