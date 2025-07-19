# Multi-stage Dockerfile for Slimbooks
# Optimized for security and small image size

# Build stage for frontend
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S slimbooks && \
    adduser -S slimbooks -u 1001 -G slimbooks

# Set working directory
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./dist

# Copy server code
COPY server ./server

# Copy environment configuration
COPY .env.production ./.env

# Create necessary directories with proper permissions
RUN mkdir -p /app/data /app/uploads /app/logs && \
    chown -R slimbooks:slimbooks /app

# Switch to non-root user
USER slimbooks

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3002/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server/index.js"]
