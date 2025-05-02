// Import core modules and Fastify plugins
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import dotenv from 'dotenv';
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { initDataSource } from "./backend/DataSource.js";
import checkEnvVars from "./utils/checkEnvVars.js";

// Import route modules
// import userRoutes from "./routes/user.js";
import pongWebsocketRoutes from "./routes/websocket.js";
import { GameLobby } from "./backend/models/GameLobby.js";
import authRoutes from "./routes/auth.js";

// Setup path variables
const __filename: string = fileURLToPath(import.meta.url);      // /app/dist/app.js
const __dirname: string = path.dirname(__filename);             // /app/dist
const __rootdir: string = path.resolve(__dirname, "..");        // /app

dotenv.config();
checkEnvVars();

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

// Serve general static assets like images, styles, icons from "assets"
fastify.register(fastifyStatic, {
    root: path.join(__rootdir, "dist", "assets"),
    prefix: "/assets",
    decorateReply: false
});

// fastify.register(fastifyCookie, {
//     secret: process.env.COOKIE_SECRET,
//     hook: 'onRequest',
//     parseOptions: {
//         secure: process.env.NODE_ENV === 'production',
//         httpOnly: true,
//         sameSite: 'strict'
//     }
// });

// Register API routes under /api/*
// fastify.register(userRoutes, { prefix: "/api" });
fastify.register(authRoutes, { prefix: "/api" });
// fastify.register(gameLobbyRoutes, {prefix "/api"});

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

	// Check if master user already exists -> db should never be accesses over initializer but over a service/middleware instead (security)
	const existingMaster = await userRepo.findOne({
		where: { email: masterEmail }
	});

	// If master user already exists, no need to create one
	if (existingMaster) {
		console.log('Master user already exists');
		return;
	}

	try {
		// Hash the master password
		const hashedPassword = await hashPW(masterPassword);

		// Create new master user
		const masterUser = userRepo.create({
			email: masterEmail,
			username: 'MASTER',
			password: hashedPassword,
			displayname: 'MASTER',
			role: 'master'
		});

		// Save master user to database
		await userRepo.save(masterUser);
		console.log('Master user created successfully');
	} catch (error) {
		console.error('Failed to create master user:', error);
	}
}

// Start the server
const start = async (): Promise<void> => {
    try {
        await initDataSource();
        await fastify.listen({ port: 3000, host: "0.0.0.0" });
    }
    catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
};

start();
