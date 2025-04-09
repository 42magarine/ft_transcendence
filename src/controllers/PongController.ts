import { WebSocket } from "ws";
import { PongGame } from "../models/Pong.js";
import { Player } from "../models/PongPlayer.js";
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
			connection.send(JSON.stringify({ type: "error", message: "Game is full" }));
			connection.close();
			return;
		}

		const player = this.setupPlayer(connection, playerId);

		this.setupMessageHandler(connection);
		this.setupCloseHandler(connection, player);
	};

	private setupPlayer(connection: WebSocket, playerId: number): Player {
		let player = this.getPlayerById(playerId);

		if (player && !player.isPlaying) {
			player.reconnect(connection);
			console.log(`Player ${playerId} reconnected!`);
		} else {
			player = new Player(connection, playerId);
			this.players.set(playerId, player);
			console.log(`Player ${playerId} connected!`);
		}

		player.send({
			type: "assignPlayer",
			id: playerId,
			state: this.game.getState(),
		});

		return player;
	}

	private setupMessageHandler(connection: WebSocket) {
		connection.on("message", (msg) => {
			let data: any;
			try {
				data = JSON.parse(msg.toString());
			} catch {
				console.warn("Invalid message:", msg);
				return;
			}

			const player = this.getPlayerByConnection(connection);
			if (!player) return;

			const handlers: Record<string, (data: any, player: Player) => void> = {
				movePaddle: this.handleMovePaddle,
				initGame: this.handleInitGame,
				resetGame: this.handleResetGame,
				pauseGame: this.handlePauseGame,
				resumeGame: this.handleResumeGame,
			};

			const handler = handlers[data.type];
			if (handler) {
				handler.call(this, data, player);
			}
		});
	}

	private setupCloseHandler(connection: WebSocket, player: Player) {
		connection.on("close", () => {
			this.clients.delete(connection);
			player.isPlaying = false;
			console.log("Client disconnected!");
			this.broadcast({
				type: "playerDisconnected",
				id: player.id,
			});
		});
	}

	private handleMovePaddle(data: any, player: Player) {
		this.game.movePaddle(player, data.direction);
		this.broadcast({
			type: "update",
			state: this.game.getState(),
		});
	}

	private handleInitGame(_: any, __: Player) {
		if (this.isRunning) return;
		this.game.resetGame();
		this.startGameLoop();
		this.broadcast({ type: "initGame", state: this.game.getState() });
	}

	private handleResetGame(_: any, __: Player) {
		this.stopGameLoop();
		this.game.resetGame();
		this.game.resetScores();
		this.startGameLoop();
		this.broadcast({ type: "reset", state: this.game.getState() });
	}

	private handlePauseGame(_: any, __: Player) {
		this.game.pauseGame();
		this.broadcast({ type: "pauseGame", state: this.game.getState() });
	}

	private handleResumeGame(_: any, __: Player) {
		this.game.resumeGame();
		if (!this.isRunning) this.startGameLoop();
		this.broadcast({ type: "resumeGame", state: this.game.getState() });
	}

	private getPlayerByConnection(conn: WebSocket): Player | undefined {
		for (const player of this.players.values()) {
			if (player.connection === conn) return player;
		}
		return undefined;
	}

	private getPlayerById(playerId: number): Player | undefined {
		return this.players.get(playerId);
	}

	private assignPlayerId(): number | null {
		if (!this.players.has(1)) return 1;
		if (!this.players.has(2)) return 2;
		return null;
	}

	private startGameLoop() {
		if (this.isRunning) return;
		this.isRunning = true;
		this.intervalId = setInterval(() => {
			if (this.game.isPaused()) return;
			this.game.update();
			this.broadcast({
				type: "update",
				state: this.game.getState(),
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
