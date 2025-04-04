// server.ts (aktualisierte Version)
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

// routes
import apiRoutes from "./routes/api.js";
import socketRoutes from "./routes/socket.js";

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const projectRoot: string = path.resolve(__dirname, "../");

// Create Fastify instance
const fastify = Fastify({
	logger: true
});

// Start the server
const start = async (): Promise<void> => {
	try {
		// Register core plugins
		await fastify.register(fastifyWebsocket);
		await fastify.register(fastifyCors, {
			origin: true // Während der Entwicklung
		});

		// Statische Dateien-Verzeichnisse
		const distDir = path.join(projectRoot, 'dist/frontend');
		if (!fs.existsSync(distDir)) {
			fs.mkdirSync(distDir, { recursive: true });
		}

		// Register static file handlers für Assets
		await fastify.register(fastifyStatic, {
			root: path.join(projectRoot, 'assets'),
			prefix: '/assets/',
			decorateReply: false
		});

		// Register static file handler für die kompilierte SPA
		await fastify.register(fastifyStatic, {
			root: distDir,
			prefix: '/',
			decorateReply: false
		});

		// Register routes
		await fastify.register(apiRoutes, { prefix: '/api' });
		await fastify.register(socketRoutes);

		// Fallback-Route für SPA (für alle nicht gefundenen Routen)
		fastify.get('*', (req, reply) => {
			return reply.sendFile('index.html', distDir);
		});

		// Start listening
		await fastify.listen({ port: 3000, host: "0.0.0.0" });
		console.log("Server started on port 3000");
	}
	catch (error) {
		fastify.log.error(error);
		process.exit(1);
	}
};

start();