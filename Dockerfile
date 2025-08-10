# Multi-stage Dockerfile for Slimbooks
# Optimized for security, smaller image size, and Raspberry Pi OS Lite compatibility

# Build stage for frontend
FROM node:20-alpine AS frontend-builder

# Minimal memory settings
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Set Puppeteer environment variables
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Set working directory
WORKDIR /app

# Copy package files (package.json and package-lock.json)
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend assets
RUN npm run build

# Production stage
FROM node:20-alpine

ENV NODE_ENV=production

RUN addgroup -g 1001 -S slimbooks && \
 adduser -S -u 1001 -G slimbooks slimbooks

WORKDIR /app

# Install system dependencies for runtime (better-sqlite3, puppeteer)
RUN apk update && apk upgrade && apk add --no-cache \
 python3 make gcc g++ sqlite-dev chromium nss freetype freetype-dev harfbuzz ca-certificates fontconfig ttf-freefont udev

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --no-audit && npm cache clean --force

# Clean up build dependencies to reduce image size
RUN apk del python3 make gcc g++ freetype-dev

# Copy the rest of app (frontend assets + server + env)
COPY --from=frontend-builder /app/dist ./dist
COPY server ./server
COPY .env.production ./.env

# Create necessary directories & fix ownership
RUN mkdir -p /app/data /app/uploads /app/logs && \
 chown -R slimbooks:slimbooks /app

USER slimbooks

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

CMD ["npm", "run", "start"]