// Import required modules
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import path from "node:path";
import { fileURLToPath } from "node:url";

// import apiRoutes from "./routes/apiRoutes.js";
import staticRoutes from "./routes/staticRoutes.js";
import websocketRoutes from "./routes/websocketRoutes.js";
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
// Plugins
fastify.register(fastifyWebsocket);
fastify.register(fastifyStatic, {
    root: path.join(__rootdir, "views"),
    prefix: "/",
});

fastify.register(fastifyStatic, {
    root: path.join(__rootdir, "assets"),
    prefix: "/assets",
    decorateReply: false
});

fastify.register(fastifyStatic, {
    root: path.join(__rootdir, "dist"),
    prefix: "/dist",
    decorateReply: false
});

fastify.register(fastifyStatic, {
    root: path.join(__rootdir, "styles"),
    prefix: "/styles",
    decorateReply: false
});

// Routes
// fastify.register(apiRoutes);
fastify.register(staticRoutes);
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
