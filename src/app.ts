import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import ReactDOMServer from "react-dom/server";
import fs from "node:fs/promises";

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

// Add custom render decorator for React
fastify.decorateReply('render', async function (componentPath: string, props: object = {}) {
	try {
		// Ensure componentPath has .js extension for correct import
		if (!componentPath.endsWith('.js')) {
			componentPath = componentPath.replace(/\.tsx?$/, '.js');
		}

		// Resolve the component path relative to the project root
		const fullPath = path.resolve(projectRoot, 'dist', componentPath);

		// Import the component dynamically
		const { default: Component } = await import(`file://${fullPath}`);

		// Render the component to HTML
		const html = ReactDOMServer.renderToString(React.createElement(Component, props));

		// Send the HTML response
		this.type('text/html').send(html);
	} catch (error) {
		fastify.log.error(`Error rendering React component: ${error}`);
		this.code(500).send(`Error rendering component: ${error}`);
	}
});

// Start the server
const start = async (): Promise<void> => {
	try {
		// Register core plugins
		await fastify.register(fastifyWebsocket);

		// Register static file handler
		await fastify.register(fastifyStatic, {
			root: projectRoot,
			decorateReply: true
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