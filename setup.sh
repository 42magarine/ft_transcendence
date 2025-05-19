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



# Check if NGROK_AUTHTOKEN is set in environment
if [ -z "$NGROK_AUTHTOKEN" ]; then
    echo "[ERROR] NGROK_AUTHTOKEN is not set. Please add it to your .env file."
    exit 1
fi

# Configure ngrok with the authtoken
ngrok config add-authtoken $NGROK_AUTHTOKEN

# Start ngrok for HTTPS tunnel
echo "[Setup] Starting ngrok tunnel for HTTPS..."
ngrok http https://localhost:3000 --log=stdout > /var/log/ngrok.log &

# Wait for ngrok to start and display the URL
sleep 5
echo "[Setup] ngrok tunnel information:"
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o 'http[^"]*')
if [ -n "$NGROK_URL" ]; then
    echo "Your application is available at: $NGROK_URL"
    echo "You can access the ngrok interface at: http://localhost:4040"
else
    echo "[ERROR] Could not retrieve ngrok URL. Check the logs with 'docker logs ft_transcendence'"
fi



# Keep container running
exec tail -f /dev/null
