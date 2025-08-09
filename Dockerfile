# Multi-stage Dockerfile for Slimbooks
# Optimized for security, smaller image size, and Raspberry Pi OS Lite compatibility

# Build stage for frontend
FROM node:20-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files (package.json and package-lock.json)
COPY package*.json ./

# Install all dependencies (including dev deps needed for build)
RUN npm i && npm cache clean --force

# Copy source code
COPY . .

# Build frontend assets
RUN npm run build

# Production stage
FROM node:20-alpine

# Create non-root user and group for security
RUN addgroup -g 1001 -S slimbooks && \
    adduser -S -u 1001 -G slimbooks slimbooks

# Install system dependencies for better-sqlite3, puppeteer, and security
RUN apk update && apk upgrade && \
    apk add --no-cache \
        dumb-init \
        python3 \
        make \
        gcc \
        g++ \
        sqlite-dev \
        chromium \
        nss \
        freetype \
        freetype-dev \
        harfbuzz \
        ca-certificates \
        fontconfig \
        ttf-freefont \
        udev && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files again for production install
COPY package*.json ./

# Copy built frontend from the builder stage
COPY --from=frontend-builder /app/dist ./dist

# Copy server code
COPY server ./server

# Copy environment config (use .env.production as default)
COPY .env.production ./.env

# Set Puppeteer to use system Chromium and configure for containerized environment
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Create data, uploads, and logs directories with proper ownership
RUN mkdir -p /app/data /app/uploads /app/logs && \
    chown -R slimbooks:slimbooks /app

# Switch to the non-root user for better security
USER slimbooks

# Expose application port
EXPOSE 3002

# Define healthcheck to confirm app readiness
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Use dumb-init as entrypoint to handle signals properly (zombie reaping)
ENTRYPOINT ["dumb-init", "--"]

# Start the node application
CMD ["node", "server/index.js"]
