#!/bin/sh

# Generate secure secrets for Slimbooks production deployment
# This script creates cryptographically secure secrets for JWT tokens

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Generating secure secrets for Slimbooks...${NC}"

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

# Function to generate a secure random string
generate_secret() {
    local length=${1:-64}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Check if openssl is available
if ! command -v openssl >/dev/null 2>&1; then
    print_error "OpenSSL is required but not installed. Please install OpenSSL first."
    exit 1
fi

# Generate secrets
echo -e "${BLUE}🎲 Generating cryptographically secure secrets...${NC}"

JWT_SECRET=$(generate_secret 64)
JWT_REFRESH_SECRET=$(generate_secret 64)
SESSION_SECRET=$(generate_secret 64)

print_status "Secrets generated successfully"

# Create or update .env file
ENV_FILE=".env"
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"

if [ -f "$ENV_FILE" ]; then
    print_warning "Existing .env file found. Creating backup..."
    cp "$ENV_FILE" "$BACKUP_FILE"
    print_status "Backup created: $BACKUP_FILE"
fi

# Create new .env file with secure secrets
echo -e "${BLUE}📝 Creating .env file with secure configuration...${NC}"

cat > "$ENV_FILE" << EOF
# Slimbooks Production Environment Configuration
# Generated on $(date)

# Server Configuration
NODE_ENV=production
PORT=3002
HOST=0.0.0.0

# Frontend Configuration
VITE_API_URL=http://localhost:3002
VITE_APP_NAME=Slimbooks
CLIENT_URL=http://localhost:8080

# Security Configuration - SECURE SECRETS
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
SESSION_SECRET=$SESSION_SECRET

# Token Expiration (in milliseconds)
ACCESS_TOKEN_EXPIRY=900000
REFRESH_TOKEN_EXPIRY=604800000
EMAIL_TOKEN_EXPIRY=86400000
PASSWORD_RESET_EXPIRY=3600000

# Database Configuration
DB_PATH=./data/slimbooks.db
DB_BACKUP_PATH=./data/backups

# CORS Configuration - UPDATE THIS FOR YOUR DOMAIN
CORS_ORIGIN=http://localhost:8080
CORS_CREDENTIALS=true

# Rate Limiting - Production settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email Configuration (if using email features)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@slimbooks.app

# Google OAuth (if using)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe Configuration (if using)
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Security Settings
BCRYPT_ROUNDS=12
MAX_FAILED_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=1800000
REQUIRE_EMAIL_VERIFICATION=true

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Development Settings (only for development)
ENABLE_DEBUG_ENDPOINTS=false
ENABLE_SAMPLE_DATA=false
EOF

print_status ".env file created with secure secrets"

# Set appropriate permissions
chmod 600 "$ENV_FILE"
print_status "File permissions set to 600 (owner read/write only)"

# Display important information
echo -e "\n${GREEN}🎉 Secure secrets generated successfully!${NC}"
echo -e "${BLUE}📊 Configuration Summary:${NC}"
echo -e "  🔐 JWT Secret: ${JWT_SECRET:0:16}... (64 characters)"
echo -e "  🔐 JWT Refresh Secret: ${JWT_REFRESH_SECRET:0:16}... (64 characters)"
echo -e "  🔐 Session Secret: ${SESSION_SECRET:0:16}... (64 characters)"

echo -e "\n${BLUE}📁 Files Created:${NC}"
echo -e "  ✅ $ENV_FILE (secure environment configuration)"
if [ -f "$BACKUP_FILE" ]; then
    echo -e "  💾 $BACKUP_FILE (backup of previous configuration)"
fi

echo -e "\n${YELLOW}⚠️  Important Security Notes:${NC}"
echo -e "  • Keep your .env file secure and never commit it to version control"
echo -e "  • Update CORS_ORIGIN to match your actual domain in production"
echo -e "  • Configure email and OAuth settings if you plan to use those features"
echo -e "  • The .env file has been set to read/write for owner only (600 permissions)"

echo -e "\n${BLUE}🔧 Next Steps:${NC}"
echo -e "  1. Review and customize the .env file as needed"
echo -e "  2. Update CORS_ORIGIN if deploying to a different domain"
echo -e "  3. Configure optional services (email, OAuth, Stripe) if needed"
echo -e "  4. Run the deployment script: ./scripts/deploy.sh"

echo -e "\n${GREEN}✅ Your Slimbooks application is now configured with secure secrets!${NC}"
