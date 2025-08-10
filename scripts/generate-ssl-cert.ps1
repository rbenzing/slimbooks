# PowerShell script to generate self-signed SSL certificate for Slimbooks
# This creates a certificate that can be used for HTTPS access from other machines on the network

param(
    [string]$CertPath = ".\certs",
    [string]$KeyFile = "server.key",
    [string]$CertFile = "server.crt",
    [int]$ValidDays = 365
)

Write-Host "Generating self-signed SSL certificate for Slimbooks..." -ForegroundColor Green

# Ensure the certs directory exists
if (-not (Test-Path $CertPath)) {
    New-Item -ItemType Directory -Path $CertPath -Force
    Write-Host "Created certificates directory: $CertPath" -ForegroundColor Yellow
}

# Get the local machine's IP address for the certificate
$LocalIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
if (-not $LocalIP) {
    $LocalIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
}
if (-not $LocalIP) {
    $LocalIP = "192.168.1.100"  # Default fallback
}

Write-Host "Using IP address: $LocalIP" -ForegroundColor Cyan

# Certificate subject
$Subject = "CN=slimbooks.local"

# Create certificate extensions for SAN (Subject Alternative Names)
$Extensions = @"
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = slimbooks.local

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = slimbooks.local
DNS.3 = *.slimbooks.local
IP.1 = 127.0.0.1
IP.2 = $LocalIP
"@

# Save the config to a temporary file
$ConfigFile = Join-Path $CertPath "cert.conf"
$Extensions | Out-File -FilePath $ConfigFile -Encoding UTF8

# Full paths
$KeyPath = Join-Path $CertPath $KeyFile
$CertPath_Full = Join-Path $CertPath $CertFile

try {
    # Check if OpenSSL is available
    $OpenSSLPath = Get-Command openssl -ErrorAction SilentlyContinue
    
    if ($OpenSSLPath) {
        Write-Host "Using OpenSSL to generate certificate..." -ForegroundColor Yellow
        
        # Generate private key
        & openssl genrsa -out $KeyPath 2048
        if ($LASTEXITCODE -ne 0) { throw "Failed to generate private key" }
        
        # Generate certificate
        & openssl req -new -x509 -key $KeyPath -out $CertPath_Full -days $ValidDays -config $ConfigFile
        if ($LASTEXITCODE -ne 0) { throw "Failed to generate certificate" }
        
        Write-Host "SSL certificate generated successfully!" -ForegroundColor Green
        Write-Host "Private Key: $KeyPath" -ForegroundColor Cyan
        Write-Host "Certificate: $CertPath_Full" -ForegroundColor Cyan
        
    } else {
        Write-Host "OpenSSL not found. Generating certificate using PowerShell (Windows only)..." -ForegroundColor Yellow
        
        # Use PowerShell's New-SelfSignedCertificate (Windows 10/Server 2016+)
        $SAN = @("localhost", "slimbooks.local", "127.0.0.1", $LocalIP)
        
        $Cert = New-SelfSignedCertificate -Subject $Subject -DnsName $SAN -NotAfter (Get-Date).AddDays($ValidDays) -KeyLength 2048 -KeyAlgorithm RSA -HashAlgorithm SHA256 -KeyUsage DigitalSignature, KeyEncipherment -EnhancedKeyUsage ServerAuthentication -CertStoreLocation "Cert:\CurrentUser\My"
        
        # Export certificate and private key
        $CertPassword = ConvertTo-SecureString -String "slimbooks" -Force -AsPlainText
        
        # Export as PFX first
        $PfxPath = Join-Path (Split-Path $KeyPath) "server.pfx"
        Export-PfxCertificate -Cert $Cert -FilePath $PfxPath -Password $CertPassword -Force
        
        # Convert PFX to PEM format for Node.js
        if (Get-Command openssl -ErrorAction SilentlyContinue) {
            # Extract private key
            & openssl pkcs12 -in $PfxPath -nocerts -out $KeyPath -nodes -password pass:slimbooks
            
            # Extract certificate
            & openssl pkcs12 -in $PfxPath -clcerts -nokeys -out $CertPath_Full -password pass:slimbooks
            
            # Clean up PFX file
            Remove-Item $PfxPath -Force
        } else {
            Write-Warning "OpenSSL not available for PEM conversion. You may need to install OpenSSL or use the PFX file: $PfxPath"
        }
        
        # Remove from certificate store
        Remove-Item "Cert:\CurrentUser\My\$($Cert.Thumbprint)" -Force
        
        Write-Host "SSL certificate generated successfully using PowerShell!" -ForegroundColor Green
        Write-Host "Private Key: $KeyPath" -ForegroundColor Cyan  
        Write-Host "Certificate: $CertPath_Full" -ForegroundColor Cyan
    }
    
    # Clean up config file
    Remove-Item $ConfigFile -Force -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Update your Docker configuration to use HTTPS"
    Write-Host "2. Access your application at https://$LocalIP:8080"
    Write-Host "3. Accept the self-signed certificate in your browser"
    Write-Host ""
    Write-Host "Note: You may need to add an exception for the self-signed certificate in your browser." -ForegroundColor Cyan

} catch {
    Write-Error "Failed to generate SSL certificate: $_"
    exit 1
}