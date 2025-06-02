import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";

import dotenv from 'dotenv';
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { UserModel } from "./backend/models/MatchModel.js";
import { hashPW } from "./backend/middleware/security.js";
import { AppDataSource, initDataSource } from "./backend/DataSource.js";
import checkEnvVars from "./utils/checkEnvVars.js";

// Import route modules
import gameRoutes from "./routes/game.js";
import userRoutes from "./routes/user.js";

// Setup path variables
const __filename: string = fileURLToPath(import.meta.url);      // /app/dist/app.js
const __dirname: string = path.dirname(__filename);             // /app/dist
const __rootdir: string = path.resolve(__dirname, "..");        // /app
const __uploaddir = path.join(__rootdir, "uploads");            // /app/uploads
const __avatarsdir = path.join(__uploaddir, "avatars");         // /app/uploads/avatars

dotenv.config();
checkEnvVars();

// Create Fastify instance
const fastify = Fastify({
    // logger: true
});

// Wichtig: Multipart muss VOR allen Routen registriert werden!
fastify.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 }, // Auf 5MB begrenzt für Avatarbilder
    attachFieldsToBody: false // Wichtig: Lässt Files als Stream
});

// Register Plugins
fastify.register(fastifyWebsocket, {
    options: { maxPayload: 1048576 }
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
    root: __avatarsdir,
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

// Register API routes
fastify.register(userRoutes);
fastify.register(gameRoutes);

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

async function createMasterUser(): Promise<void> {
    const masterEmail = process.env.MASTER_USER_EMAIL;
    const masterPassword = process.env.MASTER_USER_PASSWORD;

    if (!masterEmail || !masterPassword) {
        console.error('MASTER_USER_EMAIL or MASTER_USER_PASSWORD not set in environment');
        return;
    }

    const userRepo = AppDataSource.getRepository(UserModel);
    const existingMaster = await userRepo.findOne({ where: { email: masterEmail } });
    if (existingMaster) {
        return;
    }

    try {
        const hashedPassword = await hashPW(masterPassword);

        // Create new master user with email verified status
        const masterUser = userRepo.create({
            email: masterEmail,
            username: 'MASTER',
            name: 'MASTER',
            password: hashedPassword,
            role: 'master',
            emailVerified: true
        });

        // Save master user to database
        await userRepo.save(masterUser);
    }
    catch (error) {
        console.error('Failed to create master user:', error);
    }
}

function createDirectories(): void {
    if (!fs.existsSync(__avatarsdir)) {
        fs.mkdirSync(__avatarsdir, { recursive: true });
    }
}

// Start the server
const start = async (): Promise<void> => {
    try {
        await initDataSource();
        await createMasterUser();
        createDirectories();

        await fastify.listen({ port: 3000, host: "0.0.0.0" });

        console.log(`Server running at https://${process.env.NGROK_URL}`);
        console.log('Server running at http://localhost:3000');
    }
    catch (error) {
        console.log("app.ts - catch(error) in start()")
        fastify.log.error(error);
        process.exit(1);
    }
};

start();
