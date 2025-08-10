@echo off
REM Batch script to generate self-signed SSL certificate for Slimbooks
REM This creates a certificate that can be used for HTTPS access from other machines on the network

echo Generating self-signed SSL certificate for Slimbooks...

REM Create certs directory if it doesn't exist
if not exist "certs" mkdir certs

REM Check if OpenSSL is available
where openssl >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using OpenSSL to generate certificate...
    
    REM Generate private key
    openssl genrsa -out certs\server.key 2048
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to generate private key
        exit /b 1
    )
    
    REM Generate certificate
    openssl req -new -x509 -key certs\server.key -out certs\server.crt -days 365 -config certs\cert.conf
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to generate certificate
        exit /b 1
    )
    
    echo SSL certificate generated successfully!
    echo Private Key: certs\server.key
    echo Certificate: certs\server.crt
    
) else (
    echo OpenSSL not found in PATH. Please install OpenSSL or use PowerShell script instead.
    echo You can download OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html
    echo Or run: powershell -ExecutionPolicy Bypass -File .\scripts\generate-ssl-cert.ps1
    exit /b 1
)

echo.
echo Next steps:
echo 1. Start your Docker container: docker-compose up -d
echo 2. Access your application at https://YOUR_IP:8080
echo 3. Accept the self-signed certificate in your browser
echo.
echo Note: You may need to add an exception for the self-signed certificate in your browser.

pause