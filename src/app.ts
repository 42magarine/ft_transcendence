// Import core modules and Fastify plugins
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import fastifyMultipart from '@fastify/multipart';
import { join } from 'path';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UserModel } from "./backend/models/UserModel.js";
import { AppDataSource } from "./backend/DataSource.js";
import { hashPW } from "./backend/middleware/security.js";

import { initDataSource } from "./backend/DataSource.js";
import checkEnvVars from "./utils/checkEnvVars.js";

// Import route modules
import gameRoutes from "./routes/game.js";
import userRoutes from "./routes/user.js";
import pongWebsocketRoutes from "./routes/game.js";

// Setup path variables
const __filename: string = fileURLToPath(import.meta.url);      // /app/dist/app.js
const __dirname: string = path.dirname(__filename);             // /app/dist
const __rootdir: string = path.resolve(__dirname, "..");        // /app

// Neuer permanenter Uploads-Ordner außerhalb von dist
const UPLOADS_DIR = path.join(__rootdir, "uploads");
const AVATARS_DIR = path.join(UPLOADS_DIR, "avatars");

dotenv.config();
checkEnvVars();

// Create Fastify instance
const fastify = Fastify({
	// logger: true // Aktiviere Logger für bessere Fehlermeldungen
});

// Wichtig: Multipart muss VOR allen Routen registriert werden!
fastify.register(fastifyMultipart, {
	limits: {
		fileSize: 5 * 1024 * 1024, // Auf 5MB begrenzt für Avatarbilder
	},
	attachFieldsToBody: false // Wichtig: Lässt Files als Stream
});

// fastify.register(fastifyCors)

// Register Plugins
fastify.register(fastifyWebsocket, {
	options: {
		maxPayload: 1048576,
	},
});

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

// Serve general static assets like images, styles, icons from "assets"
fastify.register(fastifyStatic, {
	root: path.join(__rootdir, "dist", "assets"),
	prefix: "/assets",
	decorateReply: false
});

// Serve uploaded avatars from the permanent uploads directory
fastify.register(fastifyStatic, {
	root: AVATARS_DIR,
	prefix: "/uploads/avatars",
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
});

// Register API routes under /api/*
fastify.register(userRoutes, { prefix: "/api" });
fastify.register(gameRoutes, { prefix: "/api" });

// Register WebSocket routes
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

async function ensureMasterUserExists(): Promise<void> {
	// Get master user credentials from environment variables
	const masterEmail = process.env.MASTER_USER_EMAIL;
	const masterPassword = process.env.MASTER_USER_PASSWORD;

	// Validate environment variables
	if (!masterEmail || !masterPassword) {
		console.error('MASTER_USER_EMAIL or MASTER_USER_PASSWORD not set in environment');
		return;
	}

	// Get user repository
	const userRepo = AppDataSource.getRepository(UserModel);

	// Check if master user already exists
	const existingMaster = await userRepo.findOne({
		where: { email: masterEmail }
	});

	// If master user already exists, make sure it's verified
	if (existingMaster) {
		console.log('Master user already exists');

		// Ensure master user is verified if that field exists and isn't already true
		if (existingMaster.hasOwnProperty('emailVerified') && !existingMaster.emailVerified) {
			existingMaster.emailVerified = true;
			await userRepo.save(existingMaster);
			console.log('Master user email verification status updated to verified');
		}

		return;
	}

	try {
		// Hash the master password
		const hashedPassword = await hashPW(masterPassword);

		// Create new master user with email verified status
		const masterUser = userRepo.create({
			email: masterEmail,
			username: 'MASTER',
			password: hashedPassword,
			displayname: 'MASTER',
			role: 'master',
			emailVerified: true // Set the master user as verified by default
		});

		// Save master user to database
		await userRepo.save(masterUser);
		console.log('Master user created successfully with verified email');
	} catch (error) {
		console.error('Failed to create master user:', error);
	}
}

// Start the server
const start = async (): Promise<void> => {
	try {
		await initDataSource();

		// Ensure master user exists after database is initialized
		await ensureMasterUserExists();

		// Stelle sicher, dass der permanente Upload-Ordner existiert
		if (!fs.existsSync(UPLOADS_DIR)) {
			fs.mkdirSync(UPLOADS_DIR, { recursive: true });
			console.log(`Created uploads directory: ${UPLOADS_DIR}`);
		}

		if (!fs.existsSync(AVATARS_DIR)) {
			fs.mkdirSync(AVATARS_DIR, { recursive: true });
			console.log(`Created avatars directory: ${AVATARS_DIR}`);
		}

		await fastify.listen({ port: 3000, host: "0.0.0.0" });
		console.log('Server running on http://0.0.0.0:3000');
	}
	catch (error) {
		fastify.log.error(error);
		process.exit(1);
	}
};

start();
