FROM ubuntu:22.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Update and install Node.js and npm
RUN apt-get update && apt-get install -y \
    curl \
    bash \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install global tools
RUN npm install -g tailwindcss nodemon concurrently

COPY ./ /app

# Expose ports
EXPOSE 3000

# Set working directory
WORKDIR /app/src

# This will keep the container running even if node fails
CMD ["bash"]