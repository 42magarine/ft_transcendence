// Import core modules and Fastify plugins
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";        // Cross-Origin Resource Sharing
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Import route modules
import userRoutes from "./routes/user.js";
// import websocketRoutes from "./routes/websocket.js";
import pongWebsocketRoutes from "./routes/websocket.js";

// Setup path variables
const __filename: string = fileURLToPath(import.meta.url);      // /app/dist/app.js
const __dirname: string = path.dirname(__filename);             // /app/dist
const __rootdir: string = path.resolve(__dirname, "..");        // /app

// Create Fastify instance
// const fastify = Fastify({ logger: true });
const fastify = Fastify();

// Register Plugins
fastify.register(fastifyWebsocket);
fastify.register(fastifyCors, {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true
});

// Serve static HTML views accessible via "/"
fastify.register(fastifyStatic, {
    root: path.join(__rootdir, "views"),
    prefix: "/",
    decorateReply: false
});

// Serve compiled frontend from "dist"
fastify.register(fastifyStatic, {
    root: path.join(__rootdir, "dist"),
    prefix: "/dist",
    decorateReply: false
});

// Serve general static assets like images, styles, icons from "public"
fastify.register(fastifyStatic, {
    root: path.join(__rootdir, "public"),
    prefix: "/public",
    decorateReply: false
});

// Register API routes under /api/*
fastify.register(userRoutes, { prefix: "/api" });

// Register WebSocket routes
// fastify.register(websocketRoutes);
fastify.register(pongWebsocketRoutes);

// 404 Handler
fastify.setNotFoundHandler(async (request, reply) => {
    // If the URL starts with /api, return a JSON error response
    if (request.url.startsWith("/api")) {
        return reply.status(404).send({
            error: "API route not found",
            method: request.method,
            path: request.url
        });
    }

    // Otherwise, return the index.html file (SPA fallback)
    const indexPath = path.join(__rootdir, "views", "index.html");

    // Check if the file exists to avoid crashing
    if (!fs.existsSync(indexPath)) {
        return reply.status(404).send({
            error: "Not Found",
            message: "SPA entry file (index.html) is missing"
        });
    }

    return reply.type("text/html").send(fs.createReadStream(indexPath));
});

// Start the server
const start = async (): Promise<void> => {
    try {
        await fastify.listen({ port: 3000, host: "0.0.0.0" });
    }
    catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
};

start();
