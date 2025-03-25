FROM alpine:3.21.3

RUN apk add --no-cache \
    nodejs \
    npm \
    && npm install -g typescript

WORKDIR /home

CMD ["sh"]
