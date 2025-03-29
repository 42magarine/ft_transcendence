#!/bin/sh

# Install dependencies if they are missing
if [ ! -d /app/node_modules ]; then
    npm install
    echo "Installed dependencies"
fi

# Build the project if the output directories don't exist
if [ ! -d /app/html/dist ]; then
    npm run build
    echo "Built project"
fi

# Keep container running
exec tail -f /dev/null
