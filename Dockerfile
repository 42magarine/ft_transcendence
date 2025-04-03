FROM ubuntu:22.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Update and install Node.js and npm
RUN apt-get update && apt-get install -y \
	curl \
	gnupg \
	ca-certificates \
	&& curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
	&& apt-get install -y nodejs \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

# Install global tools
RUN npm install -g tailwindcss

# Copy the setup script and set execution permissions
COPY --chmod=755 ./tools/setup.sh /usr/local/bin

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 3000

# Set the entrypoint to execute the setup script
ENTRYPOINT ["setup.sh"]