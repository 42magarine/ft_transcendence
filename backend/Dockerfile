FROM alpine:3.21.3

# Install Node.js and npm
RUN apk add --no-cache \
    nodejs \
    npm

WORKDIR /home

# Copy package.json and package-lock.json first
COPY code/package*.json ./

# Install dependencies locally
RUN npm install

# Copy the rest of the project
COPY code/ .

# Compile TypeScript during build
RUN npm run build

EXPOSE 4000

# Start the Fastify server
CMD ["npm", "run", "start"]
# CMD ["sh"]
