# SSL Certificates for Slimbooks HTTPS

This directory contains the SSL certificates needed to enable HTTPS for your Slimbooks application.

## Quick Setup

### Option 1: Using Shell Script (Linux/macOS/WSL)

Make the script executable and run it:
```bash
chmod +x ../scripts/generate-ssl-certs.sh
../scripts/generate-ssl-certs.sh
```

### Option 2: Using Batch Script (Windows with OpenSSL)

Run the Windows batch script:
```bat
../scripts/generate-ssl-certs.bat
```

### Option 3: Using PowerShell (Windows)

Run the PowerShell script:
```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/generate-ssl-cert.ps1
```

### Option 4: Manual OpenSSL Commands

If you have OpenSSL installed, run:
```bash
# Generate private key
openssl genrsa -out server.key 2048

# Generate certificate
openssl req -new -x509 -key server.key -out server.crt -days 365 -config cert.conf
```

## Manual Configuration

If you need to manually edit the certificate configuration, modify `cert.conf` and update:
- Replace `IP.2 = 10.0.0.137` with your actual network IP address
- Add additional DNS names or IP addresses as needed

## Files Required

- `server.key` - Private key file
- `server.crt` - Certificate file
- `cert.conf` - Certificate configuration (used during generation)

## Testing HTTPS

1. Start your Docker container:
   ```bash
   docker-compose up -d
   ```

2. Access your application:
   - Local: https://localhost:8080
   - Network: https://YOUR_IP:8080

3. Accept the self-signed certificate warning in your browser

## Security Notes

- These are self-signed certificates for development/local network use only
- Browsers will show security warnings that you'll need to accept
- For production, use certificates from a trusted CA
- The private key should be kept secure and not shared publicly

## Troubleshooting

- Ensure both `server.key` and `server.crt` exist before starting Docker
- Check that the IP address in `cert.conf` matches your network IP
- Use `docker-compose logs slimbooks` to check for SSL-related errors