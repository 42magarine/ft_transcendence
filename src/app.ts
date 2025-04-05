import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/api.js";
import socketRoutes from "./routes/socket.js";
import fs from "fs";

// Get the directory name using ESM approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Fastify instance
const server = Fastify({
	logger: true
});

// Start the server
const start = async (): Promise<void> => {
	try {
		// Register core plugins
		await server.register(fastifyWebsocket);
		await server.register(fastifyCors, {
			origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
			credentials: true
		});

		// Bestimme die Pfade
		const assetsPath = path.join(__dirname, 'assets');
		const distPath = path.join(__dirname, '../dist'); // Pfad anpassen falls nötig
		const viewPath = path.join(__dirname, 'view');

		console.log('Assets Path:', assetsPath);
		console.log('Dist Path:', distPath);
		console.log('View Path:', viewPath);

		// Registriere statische Dateien mit spezifischen Pfaden
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

		// Registriere das View-Verzeichnis für direkte statische Dateien ohne Präfix
		if (fs.existsSync(viewPath)) {
			await server.register(fastifyStatic, {
				root: viewPath,
				prefix: '/',
				decorateReply: false,
				// Dies ist wichtig: Wenn eine Datei nicht gefunden wird, gehe zum nächsten Handler über
				// anstatt einen 404-Fehler zurückzugeben
				wildcard: false
			});
		}

		// Registriere API-Routen
		await server.register(apiRoutes, { prefix: '/api' });

		// Registriere WebSocket-Route
		await server.register(socketRoutes);

		// Handler für nicht gefundene API-Routen
		server.get('/api/*', async (request, reply) => {
			return reply.status(404).send({
				error: "API route not found",
				path: request.url
			});
		});

		// Catch-all Route für SPA - wird nur erreicht, wenn keine statische Datei gefunden wurde
		server.get('/*', async (request, reply) => {
			// Überprüfe, ob die Anfrage eine Datei mit einer Dateierweiterung sein könnte
			const pathname = new URL(request.url, 'http://localhost').pathname;
			const hasFileExtension = /\.\w+$/.test(pathname);

			// Wenn es eine Dateierweiterung hat, aber wir hier gelandet sind, existiert die Datei nicht
			if (hasFileExtension) {
				return reply.status(404).send({
					error: "Not found",
					message: `File "${pathname}" not found`
				});
			}

			// Für alle anderen Anfragen (SPA-Routen) sende index.html
			const indexPath = path.join(viewPath, 'index.html');

			if (!fs.existsSync(indexPath)) {
				return reply.status(404).send({
					error: "Not found",
					message: "SPA index file could not be found"
				});
			}

			const stream = fs.createReadStream(indexPath);
			return reply.type('text/html').send(stream);
		});

		// Start listening on port 3000
		await server.listen({ port: 3000, host: "0.0.0.0" });
		console.log("Server started on port 3000");
	}
	catch (error) {
		server.log.error(error);
		process.exit(1);
	}
};

start();