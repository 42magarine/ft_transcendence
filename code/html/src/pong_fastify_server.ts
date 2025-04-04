/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   pong_fastify_server.ts                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: fwahl <fwahl@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/04/04 17:20:53 by fwahl             #+#    #+#             */
/*   Updated: 2025/04/04 17:20:54 by fwahl            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Import required modules
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PongGame } from "./pong_game_logic.js";

// Fix for `__dirname` in ES modules
const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.resolve(path.dirname(__filename), "../");

// Create Fastify instance with logging enabled
const fastify = Fastify({ logger: true });

const game = new PongGame(800, 600);

// Register the WebSocket plugin to enable WebSocket support.
fastify.register(fastifyWebsocket);

// Define a WebSocket endpoint at /ws
fastify.register(async (fastify) => {
    fastify.get("/ws", { websocket: true }, (connection) => {
        const broadcast = (data: object) => {
            const message = JSON.stringify(data);
            fastify.websocketServer.clients.forEach((client) => {
                if (client.readyState === 1) {
                    client.send(message);
                }
            });
        };

        connection.socket.send(JSON.stringify({
            type: "initPongGame",
            board: game.getState(),
        }));

        connection.socket.on("message", (message) => {
            const data = JSON.parse(message.toString());

            if (data.type === "movePaddle") {
                const result = game.movePaddle(data.player, data.direction);
            }

            if (data.type === "resetGame") {
                const result = game.resetGame();
            }
        });
    });
});

// Register the Fastify Static plugin to serve static files
fastify.register(fastifyStatic, { root: __dirname });

// Serve `index.html` at `/`
fastify.get("/", async (_req, reply) => reply.sendFile("index.html"));

// Start game loop: updates ball + state every 16ms (~60fps)
setInterval(() => {
	game.update();

	const state = game.getState();
	const message = JSON.stringify({
		type: "update",
		state,
	});

	fastify.websocketServer.clients.forEach((client) => {
		if (client.readyState === 1) {
			client.send(message);
		}
	});
}, 16);

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
