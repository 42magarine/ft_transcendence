// Import core modules and Fastify plugins
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCookie from '@fastify/cookie'
import dotenv from 'dotenv'
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import checkEnvironmentVariables from "./utils/checkForEnvVars.js"

// Import route modules
import userRoutes from "./routes/user.js";
// import websocketRoutes from "./routes/websocket.js";
// import pongWebsocketRoutes from "./routes/websocket.js";
import { initDataSource } from "./backend/data-source.js";

// Setup path variables
const __filename: string = fileURLToPath(import.meta.url);      // /app/dist/app.js
const __dirname: string = path.dirname(__filename);             // /app/dist
const __rootdir: string = path.resolve(__dirname, "..");        // /app

if (!process.env.JWT_SECRET){
	console.log(`Looking for .env file at: ${path.join(__rootdir, '.env')}`);
	console.log(`Current working directory: ${process.cwd()}`);
	console.log(`__rootdir: ${__rootdir}`);
	dotenv.config({path: path.join(__rootdir, '.env')})
}
checkEnvironmentVariables();

// Create Fastify instance
// const fastify = Fastify({ logger: true });
const fastify = Fastify();

// Register Plugins
fastify.register(fastifyWebsocket);

// Serve static HTML views accessible via "/"
fastify.register(fastifyStatic, {
	root: path.join(__rootdir, "frontend"),
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
	root: path.join(__rootdir, "dist", "assets"),
	prefix: "/assets",
	decorateReply: false
});

fastify.register(fastifyCookie, {
	secret: process.env.COOKIE_SECRET,
	hook: 'onRequest',
	parseOptions: {
		secure: process.env.NODE_ENV === 'production',
		httpOnly: true,
		sameSite: 'strict'
	}
})

// Register API routes under /api/*
fastify.register(userRoutes, { prefix: "/api" });

// Register WebSocket routes
// fastify.register(websocketRoutes);
// fastify.register(pongWebsocketRoutes);

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

	// Check if the requested path has a file extension
	// If it does, it's likely an explicit file request and shouldn't fall back to index.html
	const hasFileExtension = path.extname(request.url) !== '';

	if (hasFileExtension) {
		return reply.status(404).send({
			error: "Not Found",
			message: `The requested file "${request.url}" was not found`
		});
	}

	// Otherwise, return the index.html file (SPA fallback)
	const indexPath = path.join(__rootdir, "frontend", "index.html");

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
initDataSource().then(() => {

	fastify.listen({ port: 3000, host: "0.0.0.0" }, (error) => {
		if (error) {
			console.error(error)
			process.exit(1)
		}
		console.log('Server listening on port 3000')
	});

})

// const start = async (): Promise<void> => {
// 	try {
// 		await fastify.listen({ port: 3000, host: "0.0.0.0" });
// 	}
// 	catch (error) {
// 		fastify.log.error(error);
// 		process.exit(1);
// 	}
// };