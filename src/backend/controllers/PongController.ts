import { WebSocket } from "ws";
import { PongGame } from "../models/Pong.js";
import { Player } from "../models/Player.js";
import { ClientMessage, ServerMessage } from "../../types/ft_types.js";
import { IGameState } from "../../types/interfaces.js"

export class PongController {
    private game: PongGame = new PongGame(800, 600);
    private players: Map<number, Player> = new Map();
    private intervalId: NodeJS.Timeout | null = null;
    private clients: Set<WebSocket> = new Set();
    private isRunning: boolean = false;

    public handleConnection = (connection: WebSocket): void => {
        console.log("A new client connected!");
        this.clients.add(connection);

        const playerId = this.assignPlayerId();

        if (!playerId) {
            this.sendMessage(connection, {
                type: "error",
                message: "Game is full"
            });
            connection.close();
            return;
        }

        const player = this.setupPlayer(connection, playerId);

        this.sendMessage(connection, {
            type: "assignPlayer",
            id: playerId,
            state: this.game.getState() as IGameState
        });

        connection.on("message", (message: string | Buffer) =>
            this.handleMessage(message, connection)
        );

        connection.on("close", () => {
            this.clients.delete(connection);
            player.isPlaying = false;
            console.log(`Player ${player.id} disconnected!`);
            this.broadcast({
                type: "playerDisconnected",
                id: player.id
            });
        });
    };

    private setupPlayer(connection: WebSocket, playerId: number): Player {
        const existingPlayer = this.players.get(playerId);
        if (existingPlayer && !existingPlayer.isPlaying) {
            existingPlayer.reconnect(connection);
            console.log(`Player ${playerId} reconnected!`);
            return existingPlayer;
        }

        const newPlayer = new Player(connection, playerId);
        this.players.set(playerId, newPlayer);
        console.log(`Player ${playerId} connected!`);
        return newPlayer;
    }

    private handleMessage(message: string | Buffer, connection: WebSocket): void {
        let data: ClientMessage;
        try {
            data = JSON.parse(message.toString()) as ClientMessage;
        }
        catch (error) {
            console.error("Invalid message format", error);
            return;
        }

        const player = this.getPlayerByConnection(connection);
        if (!player) {
            return;
        }

        switch (data.type) {
            case "movePaddle":
                if (data.direction) {
                    this.game.movePaddle(player, data.direction);
                    this.broadcast({
                        type: "update",
                        state: this.game.getState() as IGameState
                    });
                }
                break;

            case "initGame":
                if (!this.isRunning) {
                    this.game.resetGame();
                    this.startGameLoop();
                    this.broadcast({
                        type: "initGame",
                        state: this.game.getState() as IGameState
                    });
                }
                break;

            case "resetGame":
                this.stopGameLoop();
                this.game.resetGame();
                this.game.resetScores();
                this.startGameLoop();
                this.broadcast({
                    type: "resetGame",
                    state: this.game.getState() as IGameState
                });
                break;

            case "pauseGame":
                this.game.pauseGame();
                this.broadcast({
                    type: "pauseGame",
                    state: this.game.getState() as IGameState
                });
                break;

            case "resumeGame":
                this.game.resumeGame();
                if (!this.isRunning) {
                    this.startGameLoop();
                }
                this.broadcast({
                    type: "resumeGame",
                    state: this.game.getState() as IGameState
                });
                break;
        }
    }

    private getPlayerByConnection(conn: WebSocket): Player | undefined {
        for (const player of this.players.values()) {
            if (player.connection === conn) {
                return player;
            }
        }
        return undefined;         // <- was macht das?
    }

    private assignPlayerId(): number | null {
        if (!this.players.has(1)) {
            return 1;
        }
        if (!this.players.has(2)) {
            return 2;
        }
        return null;         // <- was macht das?
    }

    private startGameLoop(): void {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        this.intervalId = setInterval(() => {
            if (this.game.isPaused()) {
                return;
            }
            this.game.update();
            this.broadcast({
                type: "update",
                state: this.game.getState() as IGameState
            });
        }, 1000 / 60); // 60 FPS
    }

    private stopGameLoop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    }

    private broadcast(data: ServerMessage): void {
        const message = JSON.stringify(data);
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    private sendMessage(connection: WebSocket, data: ServerMessage): void {
        if (connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify(data));
        }
    }
}

// Controller sollte nur die Kommunikation zwischen View und Model handle'n und selbst keine Logik enthalten?

// Brauchen wir für jedes Model einen eigenen Controller?

// Sollten wir wirklich variablen mit null oder undefined ermöglichen?
