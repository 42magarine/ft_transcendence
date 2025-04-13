#!/bin/bash

# Install dependencies if missing
if [ ! -d /app/node_modules ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build project if missing
if [ ! -d /app/dist ]; then
    echo "Building project..."
    npm run build
fi

# Keep container running
exec tail -f /dev/null
