// Import core modules and Fastify plugins
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";        // Cross-Origin Resource Sharing
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// import apiRoutes from "./routes/apiRoutes.js";
import websocketRoutes from "./routes/websocket.js";
import pongWebsocketRoutes from "./routes/pongRoutes.js";
// Fix for `__dirname` in ES modules
const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const __rootdir: string = path.resolve(__dirname, "../");
// console.log(`__filename: ${__filename}`);
// console.log(`__dirname: ${__dirname}`);
// console.log(`__rootdir: ${__rootdir}`);

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

// Routes
// fastify.register(apiRoutes);
// fastify.register(websocketRoutes);
fastify.register(pongWebsocketRoutes);
// 404 Not Found handler
fastify.setNotFoundHandler(async (_request, reply) => {
    return reply.status(404).sendFile("404.html");
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
