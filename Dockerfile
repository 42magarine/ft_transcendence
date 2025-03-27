FROM alpine:3.21.3

# Install Node.js and npm
RUN apk add --no-cache \
    nodejs \
    npm
    
# Install TypeScript and http-server globally
RUN npm install -g typescript http-server

WORKDIR /home

CMD ["sh"]
