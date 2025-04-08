import { WebSocket } from "ws";
import { PongGame } from "../models/Pong.js";
import { Player } from "../models/PongPlayer.js"
import { GameController } from "./GameController.js";

export class PongController {
	private game = new PongGame(800, 600);
	private players: Map<number, Player> = new Map();
	private intervalId: NodeJS.Timeout | null = null;
	private clients: Set<WebSocket>;
	private gameController: GameController;
	private isRunning: boolean = false;

	constructor() {
		this.gameController = GameController.getInstance();
		this.clients = new Set<WebSocket>();
	}

	public handleConnection = (connection: WebSocket) => {
		console.log("A new client connected!");
		this.clients.add(connection);

		const playerId = this.assignPlayerId();
		if (!playerId) {
			connection.send(JSON.stringify({ type: "error", message: "Game is full" }))
			connection.close();
			return;
		}

		const player = new Player(connection, playerId);
		this.players.set(playerId, player);
		player.send({
			type: "assignPlayer",
			id: playerId,
			state: this.game.getState(),
		});

		connection.on("message", (message) => {
			const data = JSON.parse(message.toString());
			const player = this.getPlayerByConnection(connection);
			if (!player) return;

			// Handle paddle movement
			if (data.type === "movePaddle") {
				this.game.movePaddle(player, data.direction);
				this.broadcast({
					type: "update",
					state: this.game.getState()
				});
			}

			// Initialize game
			if (data.type === "initGame") {
				this.game.resetGame();
				this.startGameLoop();
				this.broadcast({
					type: "initGame",
					state: this.game.getState(),
				});
			}

			// Reset game
			if (data.type === "resetGame") {
				this.stopGameLoop();
				this.game.resetGame();
				this.broadcast({
					type: "reset",
					state: this.game.getState()
				});
			}

			// Stop the game
			if (data.type === "pauseGame") {
				this.game.pauseGame();
				this.broadcast({
					type: "pauseGame",
					state: this.game.getState()
				});
			}
			// Resume the game
			if (data.type === "resumeGame") {
				this.game.resumeGame();

				if (!this.isRunning) {
					this.startGameLoop();
				}

				this.broadcast({
					type: "resumeGame",
					state: this.game.getState()
				});
			}
		});

		connection.on("close", () => {
			this.clients.delete(connection);
			console.log("Client disconnected!");
		});
	};

	private getPlayerByConnection(conn: WebSocket): Player | undefined {
		for (const player of this.players.values()) {
			if (player.connection === conn) return player;
		}
		return undefined;
	}

	private assignPlayerId(): number | null {
		if (!this.players.has(1)) return 1;
		if (!this.players.has(2)) return 2;
		return null;
	}

	private startGameLoop() {
		if (this.isRunning === true) return;
		this.isRunning = true;
		this.intervalId = setInterval(() => {
			if (this.game.isPaused() === true) return;
			this.game.update();
			this.broadcast({
				type: "update",
				state: this.game.getState()
			});
		}, 1000 / 60); // 60 FPS
	}

	private stopGameLoop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.isRunning = false;
	}

	private broadcast(data: object) {
		const message = JSON.stringify(data);

		this.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(message);
			}
		});
	}
}

