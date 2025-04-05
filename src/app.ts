import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/api.js";
import socketRoutes from "./routes/socket.js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = Fastify({
	logger: true
});

const start = async (): Promise<void> => {
	try {
		await server.register(fastifyWebsocket);
		await server.register(fastifyCors, {
			origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
			credentials: true
		});

		const assetsPath = path.join(__dirname, 'assets');
		const distPath = path.join(__dirname, '../dist');
		const viewPath = path.join(__dirname, 'views');

		if (fs.existsSync(assetsPath)) {
			await server.register(fastifyStatic, {
				root: assetsPath,
				prefix: '/assets',
				decorateReply: false
			});
		}

		if (fs.existsSync(distPath)) {
			await server.register(fastifyStatic, {
				root: distPath,
				prefix: '/dist',
				decorateReply: false
			});
		}

		if (fs.existsSync(viewPath)) {
			await server.register(fastifyStatic, {
				root: viewPath,
				prefix: '/',
				decorateReply: false,
				wildcard: false
			});
		}

		await server.register(apiRoutes, { prefix: '/api' });
		await server.register(socketRoutes);

		server.get('/api/*', async (request, reply) => {
			return reply.status(404).send({
				error: "API route not found",
				path: request.url
			});
		});

		server.get('/*', async (request, reply) => {
			const pathname = new URL(request.url, 'http://localhost').pathname;
			const hasFileExtension = /\.\w+$/.test(pathname);

			if (hasFileExtension) {
				return reply.status(404).send({
					error: "Not found",
					message: `File "${pathname}" not found`
				});
			}

			const indexPath = path.join(viewPath, 'index.html');
			console.log("\n\n\n" + indexPath + "\n\n\n")
			if (!fs.existsSync(indexPath)) {
				return reply.status(404).send({
					error: "Not found",
					message: "SPA index file could not be found"
				});
			}

			const stream = fs.createReadStream(indexPath);
			return reply.type('text/html').send(stream);
		});

		await server.listen({ port: 3000, host: "0.0.0.0" });
		console.log("Server started on port 3000");
	}
	catch (error) {
		server.log.error(error);
		process.exit(1);
	}
};

start();