import { FastifyInstance } from "fastify";
import { game } from "../app.js";

export default async function socketRoutes(fastify: FastifyInstance): Promise<void> {
	// Define a WebSocket endpoint at /ws
	fastify.get("/ws", { websocket: true }, (connection) => {
		console.log("socket")
		const broadcast = (data: object) => {
			const message = JSON.stringify(data);
			fastify.websocketServer.clients.forEach((client) => {
				if (client.readyState === 1) {
					client.send(message);
				}
			});
		};

		// Send initial board state to the client
		connection.send(JSON.stringify({
			type: "initBoard",
			board: game.getBoard(),
		}));

		// Handle incoming messages
		connection.on("message", (message) => {
			const data = JSON.parse(message.toString());

			if (data.type === "makeMove") {
				const result = game.makeMove(data.index);
				broadcast(result);
			}

			if (data.type === "resetGame") {
				const result = game.resetGame();
				broadcast(result);
			}
		});
	});
}