FROM node:20-bookworm-slim

WORKDIR /app

# Skip Chromium download during npm ci; PDF export can be configured later.
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV API_PORT=3180

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN mkdir -p data/shares

EXPOSE 3180

CMD ["npm", "start"]
