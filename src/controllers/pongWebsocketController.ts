import { FastifyInstance } from "fastify";
import { WebSocket } from "ws";
import { PongGame } from "../models/Pong.js";
import { Player } from "../models/PongPlayer.js"

export default class WebsocketController {
    private game = new PongGame(800, 600);
	private players: Map<number, Player> = new Map(); // make class later
	private intervalId: NodeJS.Timeout | null = null;

    constructor(private fastify: FastifyInstance) { }

    public handleConnection = (connection: WebSocket) => {
		const playerId = this.assignPlayerId();
		if (!playerId) {
			connection.send(JSON.stringify({ type: "error", message: "Game is full"}))
			connection.close();
			return ;
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

            if (data.type === "movePaddle") {
                const result = this.game.movePaddle(player.id, data.direction);
                this.broadcast({
					type: "update",
					state: this.game.getState()
				});
            }

			if (data.type === "initGame") {
				// Initialize the game state and start the game
				this.game.resetGame();
				this.startGameLoop();
				this.broadcast({
					type: "initGame",
					state: this.game.getState(),
				});
			}

            if (data.type === "resetGame") {
                const result = this.game.resetGame();
                this.broadcast({
					type: "reset",
					state: this.game.getState()
				});
            }
        });
    };

	private assignPlayerId(): number | null {
		if (!this.players.has(1)) return 1;
		if (!this.players.has(2)) return 2;
		return null;
	}

	private startGameLoop() {
		this.intervalId = setInterval(() => {
			this.game.update();
			this.broadcast({
				type: "update",
				state: this.game.getState()
			});
		}, 1000 / 60); // 60 FPS
	}

    private broadcast(data: object) {
        const message = JSON.stringify(data);
        this.fastify.websocketServer.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(message);
            }
        });
    }
}
