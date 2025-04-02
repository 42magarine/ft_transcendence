import { FastifyInstance } from "fastify";
import { WebSocket } from "ws";
import { GameController } from "./GameController.js";

export class SocketController {
	private static instance: SocketController;
	private fastify: FastifyInstance | null = null;
	private gameController: GameController;

	private constructor() {
		this.gameController = GameController.getInstance();
	}

	public static getInstance(): SocketController {
		if (!SocketController.instance) {
			SocketController.instance = new SocketController();
		}
		return SocketController.instance;
	}

	public setFastify(fastify: FastifyInstance): void {
		this.fastify = fastify;
	}

	public broadcast(data: object): void {
		if (!this.fastify) {
			console.error("Fastify instance not set");
			return;
		}

		const message = JSON.stringify(data);
		this.fastify.websocketServer.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(message);
			}
		});
	}

	public setupWebSocket(connection: WebSocket): void {
		// Send initial game state to the connecting client
		const initialState = this.gameController.initGame();
		connection.send(JSON.stringify(initialState));

		// EVENTS
		connection.on("message", (message: any) => {
			try {
				const data = JSON.parse(message.toString());

				if (data.type === "makeMove") {
					const result = this.gameController.makeMove(data.index);
					this.broadcast(result);
				}

				if (data.type === "resetGame") {
					const result = this.gameController.resetGame();
					this.broadcast(result);
				}
			} catch (error) {
				console.error("Error processing WebSocket message:", error);
			}
		});

		// Handle disconnection
		connection.on("close", () => {
			console.log("Client disconnected");
		});
	}
}