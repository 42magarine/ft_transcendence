// Import required modules
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TicTacToe } from "./game_logic.js";

// Import routes
import generalRoutes from "./routes/general.js";
import notFoundRoutes from "./routes/404.js";
import socketRoutes from "./routes/socket.js";

// Fix for `__dirname` in ES modules
const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const projectRoot: string = path.resolve(__dirname, "../");

// Create Fastify instance with logging enabled
const fastify = Fastify({ logger: true });

// Create game instance and export it
export const game: TicTacToe = new TicTacToe();

// Register the WebSocket plugin to enable WebSocket support
fastify.register(fastifyWebsocket);

// Register the Fastify Static plugin to serve static files
fastify.register(fastifyStatic, {
	root: projectRoot,
	decorateReply: true  // Ensure reply.sendFile is available
});

// Register routes
fastify.register(generalRoutes);
fastify.register(notFoundRoutes);
fastify.register(socketRoutes);

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