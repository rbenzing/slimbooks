#!/bin/bash

# Slimbooks Production Deployment Script for Raspberry Pi
# This script builds and deploys the application using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="slimbooks"
CONTAINER_NAME="slimbooks-app"
IMAGE_NAME="slimbooks:latest"
PORT=8080
DATA_DIR="./data"
UPLOADS_DIR="./uploads"
LOGS_DIR="./logs"

echo -e "${BLUE}🚀 Starting Slimbooks deployment...${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is available and running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_warning "docker-compose not found, using 'docker compose' instead"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Create necessary directories
echo -e "${BLUE}📁 Creating necessary directories...${NC}"
mkdir -p "$DATA_DIR" "$UPLOADS_DIR" "$LOGS_DIR"
print_status "Directories created"

# Check for environment file
if [ ! -f ".env" ]; then
    print_warning "No .env file found. Creating from .env.production template..."
    if [ -f ".env.production" ]; then
        cp .env.production .env
        print_warning "Please edit .env file and update the JWT secrets before continuing!"
        echo -e "${YELLOW}Press any key to continue after updating .env file...${NC}"
        read -n 1 -s
    else
        print_error ".env.production template not found. Please create .env file manually."
        exit 1
    fi
fi

# Validate critical environment variables
echo -e "${BLUE}🔍 Validating environment configuration...${NC}"
source .env

if [[ "$JWT_SECRET" == *"CHANGE_THIS"* ]] || [[ "$JWT_SECRET" == *"default"* ]]; then
    print_error "JWT_SECRET is not properly configured in .env file!"
    exit 1
fi

if [[ "$JWT_REFRESH_SECRET" == *"CHANGE_THIS"* ]] || [[ "$JWT_REFRESH_SECRET" == *"default"* ]]; then
    print_error "JWT_REFRESH_SECRET is not properly configured in .env file!"
    exit 1
fi

print_status "Environment configuration validated"

# Stop existing container if running
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
$DOCKER_COMPOSE down --remove-orphans || true
print_status "Existing containers stopped"

# Build the application
echo -e "${BLUE}🔨 Building application...${NC}"
npm ci --only=production
npm run build
print_status "Application built successfully"

# Build Docker image
echo -e "${BLUE}🐳 Building Docker image...${NC}"
docker build -t "$IMAGE_NAME" .
print_status "Docker image built successfully"

# Start the application
echo -e "${BLUE}🚀 Starting application...${NC}"
$DOCKER_COMPOSE up -d
print_status "Application started successfully"

# Wait for application to be ready
echo -e "${BLUE}⏳ Waiting for application to be ready...${NC}"
sleep 10

# Health check
echo -e "${BLUE}🏥 Performing health check...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:$PORT/api/health &> /dev/null; then
        print_status "Application is healthy and ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Health check failed after 30 attempts"
        echo -e "${YELLOW}Checking logs...${NC}"
        $DOCKER_COMPOSE logs --tail=20
        exit 1
    fi
    echo -n "."
    sleep 2
done

# Display deployment information
echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📊 Deployment Information:${NC}"
echo -e "  🌐 Application URL: http://localhost:$PORT"
echo -e "  🐳 Container Name: $CONTAINER_NAME"
echo -e "  📁 Data Directory: $DATA_DIR"
echo -e "  📤 Uploads Directory: $UPLOADS_DIR"
echo -e "  📝 Logs Directory: $LOGS_DIR"

echo -e "\n${BLUE}🔧 Useful Commands:${NC}"
echo -e "  View logs: $DOCKER_COMPOSE logs -f"
echo -e "  Stop app: $DOCKER_COMPOSE down"
echo -e "  Restart: $DOCKER_COMPOSE restart"
echo -e "  Update: ./scripts/deploy.sh"

echo -e "\n${GREEN}✅ Slimbooks is now running on your Raspberry Pi!${NC}"
