FROM alpine:3.21.3

# Install npm
RUN apk add --no-cache \
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

EXPOSE 3000

# Serve the frontend with http-server
CMD ["npm", "run", "serve"]
# CMD ["sh"]
