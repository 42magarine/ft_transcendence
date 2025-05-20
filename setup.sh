#!/bin/bash

# Check if NGROK_AUTHTOKEN and NGROK_URL are set in environment
if [ -z "$NGROK_AUTHTOKEN" ] || [ -z "$NGROK_URL" ]; then
  echo "[ERROR] NGROK_AUTHTOKEN and NGROK_URL must be set in .env file."
  exit 1
fi

# Install dependencies if missing
if [ ! -d /app/node_modules ]; then
  echo "[Setup] Installing dependencies..."
  npm install
else
  echo "[Setup] Dependencies already installed."
fi

# Configure ngrok with the authtoken
echo "[Setup] Configuring ngrok..."
ngrok config add-authtoken $NGROK_AUTHTOKEN

# Start ngrok in background to create a tunnel to port 3000
echo "[Setup] Starting ngrok tunnel..."
ngrok http http://localhost:3000 --domain=$NGROK_URL > /var/log/ngrok.log 2>&1 &

# Wait for ngrok to start
sleep 3
echo "[Setup] Your application is available at: https://$NGROK_URL"

# Start the application in development mode
echo "[Setup] Starting application with npm run dev..."
exec npm run dev
