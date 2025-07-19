#!/bin/bash

# Raspberry Pi Setup Script for Slimbooks
# This script prepares a Raspberry Pi for running Slimbooks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🥧 Setting up Raspberry Pi for Slimbooks...${NC}"

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

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
    print_warning "This doesn't appear to be a Raspberry Pi, but continuing anyway..."
fi

# Update system packages
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y
print_status "System packages updated"

# Install required packages
echo -e "${BLUE}📦 Installing required packages...${NC}"
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release
print_status "Required packages installed"

# Install Docker
echo -e "${BLUE}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index
    sudo apt update
    
    # Install Docker
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_status "Docker installed successfully"
else
    print_status "Docker is already installed"
fi

# Install Docker Compose (standalone)
echo -e "${BLUE}🐳 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    # Get latest version
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    # Download and install
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose is already installed"
fi

# Install Node.js (for building the application)
echo -e "${BLUE}📦 Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    print_status "Node.js installed successfully"
else
    print_status "Node.js is already installed"
fi

# Create application directory
echo -e "${BLUE}📁 Creating application directory...${NC}"
APP_DIR="/opt/slimbooks"
sudo mkdir -p "$APP_DIR"
sudo chown $USER:$USER "$APP_DIR"
print_status "Application directory created at $APP_DIR"

# Configure firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    echo -e "${BLUE}🔥 Configuring firewall...${NC}"
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 8080/tcp  # Slimbooks application
    print_status "Firewall configured"
fi

# Create systemd service for auto-start
echo -e "${BLUE}⚙️  Creating systemd service...${NC}"
sudo tee /etc/systemd/system/slimbooks.service > /dev/null <<EOF
[Unit]
Description=Slimbooks Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
print_status "Systemd service created"

# Set up log rotation
echo -e "${BLUE}📝 Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/slimbooks > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
print_status "Log rotation configured"

# Create backup script
echo -e "${BLUE}💾 Creating backup script...${NC}"
sudo tee /usr/local/bin/slimbooks-backup > /dev/null <<'EOF'
#!/bin/bash
# Slimbooks backup script

BACKUP_DIR="/opt/slimbooks-backups"
APP_DIR="/opt/slimbooks"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup database
if [ -f "$APP_DIR/data/slimbooks.db" ]; then
    cp "$APP_DIR/data/slimbooks.db" "$BACKUP_DIR/slimbooks_$DATE.db"
    echo "Database backed up to $BACKUP_DIR/slimbooks_$DATE.db"
fi

# Backup uploads
if [ -d "$APP_DIR/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$APP_DIR" uploads
    echo "Uploads backed up to $BACKUP_DIR/uploads_$DATE.tar.gz"
fi

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.db" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

sudo chmod +x /usr/local/bin/slimbooks-backup
print_status "Backup script created"

# Set up daily backup cron job
echo -e "${BLUE}⏰ Setting up daily backup...${NC}"
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/slimbooks-backup") | crontab -
print_status "Daily backup scheduled at 2 AM"

# Display setup completion
echo -e "\n${GREEN}🎉 Raspberry Pi setup completed successfully!${NC}"
echo -e "${BLUE}📊 Setup Summary:${NC}"
echo -e "  🐳 Docker and Docker Compose installed"
echo -e "  📦 Node.js installed"
echo -e "  📁 Application directory: $APP_DIR"
echo -e "  🔥 Firewall configured (if ufw available)"
echo -e "  ⚙️  Systemd service created"
echo -e "  📝 Log rotation configured"
echo -e "  💾 Daily backup scheduled"

echo -e "\n${BLUE}🔧 Next Steps:${NC}"
echo -e "  1. Reboot the system: sudo reboot"
echo -e "  2. Clone your Slimbooks repository to $APP_DIR"
echo -e "  3. Run the deployment script: ./scripts/deploy.sh"
echo -e "  4. Enable auto-start: sudo systemctl enable slimbooks"

echo -e "\n${YELLOW}⚠️  Important Notes:${NC}"
echo -e "  • You may need to log out and back in for Docker group membership to take effect"
echo -e "  • Make sure to configure your .env file with secure secrets"
echo -e "  • The application will be accessible on port 8080"
echo -e "  • Backups are stored in /opt/slimbooks-backups"

echo -e "\n${GREEN}✅ Your Raspberry Pi is now ready for Slimbooks!${NC}"
