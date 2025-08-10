#!/bin/sh
# Shell script to generate self-signed SSL certificate for Slimbooks
# This creates a certificate that can be used for HTTPS access from other machines on the network

set -e

echo ""
echo "================================="
echo "  Slimbooks SSL Certificate Setup"
echo "================================="
echo ""

echo "This script will generate SSL certificates for HTTPS access."
echo "Checking for OpenSSL..."

# Check if OpenSSL is available
if ! command -v openssl >/dev/null 2>&1; then
    echo "ERROR: OpenSSL not found in PATH."
    echo ""
    echo "Please install OpenSSL:"
    echo "  Ubuntu/Debian: sudo apt-get install openssl"
    echo "  CentOS/RHEL:   sudo yum install openssl"
    echo "  macOS:         brew install openssl"
    echo ""
    exit 1
fi

echo "✓ OpenSSL found!"
echo ""

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Check if cert.conf exists
if [ ! -f "cert.conf" ]; then
    echo "ERROR: cert.conf not found in $(pwd)"
    echo "Make sure you're running this script from the certs directory."
    exit 1
fi

echo "Generating certificates..."
echo ""

# Generate private key
echo "Generating private key..."
if openssl genrsa -out ../certs/server.key 2048; then
    echo "✓ Private key generated: ../certs/server.key"
else
    echo "ERROR: Failed to generate private key"
    exit 1
fi

# Generate certificate
echo "Generating certificate..."
if openssl req -new -x509 -key ../certs/server.key -out ../certs/server.crt -days 365 -config cert.conf; then
    echo "✓ Certificate generated: ../certs/server.crt"
else
    echo "ERROR: Failed to generate certificate"
    exit 1
fi

echo ""
echo "✅ SSL certificates generated successfully!"
echo ""
echo "Files created:"
echo "  - server.key (private key)"
echo "  - server.crt (certificate)"
echo ""
echo "Next steps:"
echo "  1. Start Docker: docker-compose up -d"
echo "  2. Access at: https://localhost:8080 or https://YOUR_IP:8080"
echo "  3. Accept the certificate warning in your browser"
echo ""

# Get local IP address (best effort, compatible with sh)
LOCAL_IP=$(hostname -I 2>/dev/null | cut -d' ' -f1 || ifconfig 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | head -n1 | awk '{print $2}' | cut -d: -f2 2>/dev/null || echo "YOUR_IP")

if [ "$LOCAL_IP" != "YOUR_IP" ] && [ -n "$LOCAL_IP" ]; then
    echo "Your local IP appears to be: $LOCAL_IP"
    echo "Try accessing: https://$LOCAL_IP:8080"
    echo ""
fi

echo "Note: You may need to update cert.conf with your actual IP address"
echo "and regenerate the certificates for network access."