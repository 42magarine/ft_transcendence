import { WebSocket } from "ws";
import { PongGame } from "../models/Pong.js";
import { Player } from "../models/Player.js";
import { ClientMessage, ServerMessage } from "../types/ft_types.js";
import { IGameState } from "../types/interfaces.js"
export class PongController {
    private game: PongGame = new PongGame();
    private players: Map<number, Player> = new Map();
    private clients: Set<WebSocket> = new Set();
    private isRunning: boolean = false;

    public handleConnection = (connection: WebSocket): void => {
        console.log("A new client connected!");
        this.clients.add(connection);

        const playerId = Player.assignPlayerId(this.players);
        if (!playerId) {
            this.sendMessage(connection, {
                type: "error",
                message: "Game is full"
            });
            connection.close();
            return;
        }

        const player = Player.setupPlayer(connection, playerId, this.players);

        this.sendMessage(connection, {
            type: "assignPlayer",
            id: playerId,
            state: this.game.getState() as IGameState
        });

        connection.on("message", (message: string | Buffer) =>
            this.handleMessage(message, connection)
        );

        connection.on("close", () => {
            this.handleClose(connection, player);
        });
    };

    private handleMessage(message: string | Buffer, connection: WebSocket): void {
        let data: ClientMessage;
        try {
            data = JSON.parse(message.toString()) as ClientMessage;
        }
        catch (error) {
            console.error("Invalid message format", error);
            return;
        }

        const player = Player.findByConnection(this.players, connection);
        if (!player) {
            return;
        }

        const handlers: Record<string, () => void> = {
            movePaddle: () => this.handleMovePaddle(player, data),
            initGame: () => this.handleInitGame(),
            resetGame: () => this.handleResetGame(),
            pauseGame: () => this.handlePauseGame(),
            resumeGame: () => this.handleResumeGame(),
        };

        if (handlers[data.type]) {
            handlers[data.type]();
        }
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

    //handlers

    private handleMovePaddle(player: Player, data: any): void {
        if (data.direction) {
            this.game.movePaddle(player, data.direction);
            this.broadcast({ type: "update", state: this.game.getState() });
        }
    }

    private handleInitGame(): void {
        if (!this.isRunning) {
            this.game.resetGame();
            this.game.startGameLoop(this.broadcast.bind(this));
            this.broadcast({ type: "initGame", state: this.game.getState() });
        }
    }

    private handleResetGame(): void {
        this.game.stopGameLoop();
        this.game.resetGame();
        this.game.resetScores();
        this.game.startGameLoop(this.broadcast.bind(this));
        this.broadcast({ type: "resetGame", state: this.game.getState() });
    }

    private handlePauseGame(): void {
        this.game.pauseGame();
        this.broadcast({ type: "pauseGame", state: this.game.getState() });
    }

    private handleResumeGame(): void {
        this.game.resumeGame();
        if (!this.isRunning) {
            this.game.startGameLoop(this.broadcast.bind(this));
        }
        this.broadcast({ type: "resumeGame", state: this.game.getState() });
    }

    private handleClose(connection: WebSocket, player: Player): void {
        this.clients.delete(connection);
        player.isPlaying = false;
        console.log(`Player ${player.id} disconnected!`);
        this.broadcast({
            type: "playerDisconnected",
            id: player.id
        });
    }


}





// Controller sollte nur die Kommunikation zwischen View und Model handle'n und selbst keine Logik enthalten?

// Brauchen wir für jedes Model einen eigenen Controller?

// Sollten wir wirklich variablen mit null oder undefined ermöglichen?
