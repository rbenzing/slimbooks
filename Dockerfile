# Multi-stage Dockerfile for Slimbooks
# Optimized for security, smaller image size, and Raspberry Pi OS Lite compatibility

# Build stage for frontend
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files (package.json and package-lock.json)
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build frontend assets
RUN npm run build

# Production stage
FROM node:18-alpine

# Create non-root user and group for security
RUN addgroup -g 1001 -S slimbooks && \
    adduser -S -u 1001 -G slimbooks slimbooks

# Install dumb-init for proper signal handling and any security updates
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files again for production install
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built frontend from the builder stage
COPY --from=frontend-builder /app/dist ./dist

# Copy server code
COPY server ./server

# Copy environment config (use .env.production as default)
COPY .env.production ./.env

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
