import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import fastifyView from "@fastify/view";
import ejs from "ejs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

// routes
import generalRoutes from "./routes/general.js";
import socketRoutes from "./routes/socket.js";
import notFoundRoutes from "./routes/notFound.js";

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const projectRoot: string = path.resolve(__dirname, "../");

// Create Fastify instance
const fastify = Fastify({
	logger: true
});

// Register view engine with EJS
await fastify.register(fastifyView, {
	engine: {
		ejs: ejs
	},
	root: path.join(projectRoot, 'views'),
	viewExt: 'ejs'
});

// Start the server
const start = async (): Promise<void> => {
	try {
		// Register core plugins
		await fastify.register(fastifyWebsocket);

		// Create public directory if it doesn't exist
		const publicDir = path.join(projectRoot, 'public');
		if (!fs.existsSync(publicDir)) {
			fs.mkdirSync(publicDir, { recursive: true });
		}

		// Register static file handlers
		await fastify.register(fastifyStatic, {
			root: publicDir,
			prefix: '/public/',
			decorateReply: true // Set to true for the first one
		});

		// Register static file handler for compiled CSS
		await fastify.register(fastifyStatic, {
			root: path.join(projectRoot, 'dist/styles'),
			prefix: '/styles/',
			decorateReply: false
		});

		// Register routes
		await fastify.register(generalRoutes);
		await fastify.register(socketRoutes);
		await fastify.register(notFoundRoutes);

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