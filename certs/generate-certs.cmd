@echo off
echo.
echo =================================
echo  Slimbooks SSL Certificate Setup
echo =================================
echo.

echo This script will help you generate SSL certificates for HTTPS access.
echo You'll need OpenSSL installed for this to work.
echo.

echo Checking for OpenSSL...
where openssl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: OpenSSL not found in PATH.
    echo.
    echo Please install OpenSSL:
    echo 1. Download OpenSSL
    echo 2. Install and add to PATH
    echo 3. Run this script again
    echo.
    echo Alternative: Use PowerShell script instead:
    echo    powershell -ExecutionPolicy Bypass -File ..\scripts\generate-ssl-cert.ps1
    echo.
    pause
    exit /b 1
)

echo OpenSSL found! Generating certificates...
echo.

REM Generate private key
echo Generating private key...
openssl genrsa -out server.key 2048
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate private key
    pause
    exit /b 1
)

REM Generate certificate
echo Generating certificate...
openssl req -new -x509 -key server.key -out server.crt -days 365 -config cert.conf
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate certificate
    pause
    exit /b 1
)

echo.
echo ✅ SSL certificates generated successfully!
echo.
echo Files created:
echo - server.key (private key)
echo - server.crt (certificate)
echo.
echo Next steps:
echo 1. Start Docker: docker-compose up -d
echo 2. Access at: https://localhost:8080 or https://YOUR_IP:8080
echo 3. Accept the certificate warning in your browser
echo.
pause