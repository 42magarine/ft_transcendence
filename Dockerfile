FROM alpine:3.21.3

# Install Node.js and npm
RUN apk add --no-cache \
    nodejs \
    npm

# Copy the setup script and set execution permissions
COPY --chmod=755 ./setup.sh /usr/local/bin

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 3000

# Set the entrypoint to execute the setup script
ENTRYPOINT [ "setup.sh" ]
