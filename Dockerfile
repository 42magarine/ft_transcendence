FROM debian:bookworm

# Install curl and openssll
RUN apt-get update && apt-get install -y \
    curl \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js v22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# Install ngrok (no account needed for basic usage)
RUN curl https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz -O && \
    tar -xvzf ngrok-v3-stable-linux-amd64.tgz -C /usr/local/bin && \
    rm ngrok-v3-stable-linux-amd64.tgz

# Copy the setup script and set execution permissions
COPY --chmod=755 ./setup.sh /usr/local/bin

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 3000 4040

# Set the entrypoint
ENTRYPOINT ["setup.sh"]
