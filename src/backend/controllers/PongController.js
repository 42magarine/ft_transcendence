import { WebSocket } from "ws";
import { PongGame } from "../models/Pong.js";
import { Player } from "../models/Player.js";
export class PongController {
    game = new PongGame(800, 600);
    players = new Map();
    intervalId = null;
    clients = new Set();
    isRunning = false;
    handleConnection = (connection) => {
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
            state: this.game.getState()
        });
        connection.on("message", (message) => this.handleMessage(message, connection));
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
    setupPlayer(connection, playerId) {
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
    handleMessage(message, connection) {
        let data;
        try {
            data = JSON.parse(message.toString());
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
                        state: this.game.getState()
                    });
                }
                break;
            case "initGame":
                if (!this.isRunning) {
                    this.game.resetGame();
                    this.startGameLoop();
                    this.broadcast({
                        type: "initGame",
                        state: this.game.getState()
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
                    state: this.game.getState()
                });
                break;
            case "pauseGame":
                this.game.pauseGame();
                this.broadcast({
                    type: "pauseGame",
                    state: this.game.getState()
                });
                break;
            case "resumeGame":
                this.game.resumeGame();
                if (!this.isRunning) {
                    this.startGameLoop();
                }
                this.broadcast({
                    type: "resumeGame",
                    state: this.game.getState()
                });
                break;
        }
    }
    getPlayerByConnection(conn) {
        for (const player of this.players.values()) {
            if (player.connection === conn) {
                return player;
            }
        }
        return undefined; // <- was macht das?
    }
    assignPlayerId() {
        if (!this.players.has(1)) {
            return 1;
        }
        if (!this.players.has(2)) {
            return 2;
        }
        return null; // <- was macht das?
    }
    startGameLoop() {
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
                state: this.game.getState()
            });
        }, 1000 / 60); // 60 FPS
    }
    stopGameLoop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    }
    broadcast(data) {
        const message = JSON.stringify(data);
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    sendMessage(connection, data) {
        if (connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify(data));
        }
    }
}
// Controller sollte nur die Kommunikation zwischen View und Model handle'n und selbst keine Logik enthalten?
// Brauchen wir für jedes Model einen eigenen Controller?
// Sollten wir wirklich variablen mit null oder undefined ermöglichen?
