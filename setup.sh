#!/bin/bash

# Generate self-signed cert for local HTTPS
if [ ! -f /etc/ssl/private/key.pem ] || [ ! -f /etc/ssl/private/cert.pem ]; then
    echo "[Setup] Generating new self-signed certificate..."
    openssl req -newkey rsa:2048 -x509 -noenc \
        -keyout /etc/ssl/private/key.pem \
        -out /etc/ssl/private/cert.pem \
        -subj "/C=DE/ST=Baden-Württemberg/L=Heilbronn/O=42 Heilbronn/OU=ft_transcendence/CN=localhost"
else
    echo "[Setup] Certificate already exists."
fi

# Install dependencies if missing
if [ ! -d /app/node_modules ]; then
    echo "[Setup] Installing dependencies..."
    npm install
fi

# Build project if missing
if [ ! -d /app/dist ]; then
    echo "[Setup] Building project..."
    npm run build
fi

echo "[Setup] Done."

# Keep container running
exec tail -f /dev/null
