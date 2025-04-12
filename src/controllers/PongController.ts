import { WebSocket } from "ws";
import { PongGame } from "../models/Pong.js";
import { Player } from "../models/Player.js";
import { MessageHandlers } from "./MessageHandlers.js";
import { ClientMessage, ServerMessage } from "../types/ft_types.js";

export class PongController {
    private game: PongGame = new PongGame();
    private players: Map<number, Player> = new Map();
    private clients: Set<WebSocket> = new Set();
    private handlers: MessageHandlers;

    constructor() {
        this.handlers = new MessageHandlers(this.game, this.broadcast.bind(this));
    }

    public handleConnection = (connection: WebSocket): void => {
        console.log("A new client connected!");
        this.clients.add(connection);

        const player = Player.init(
            connection,
            this.players,
            () => this.game.getState(),
            (conn: WebSocket, msg: ServerMessage) => this.sendMessage(conn, msg)
        );
        if (!player) return;

        console.log('handleConnection: Players after connection:', this.players);

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
        } catch (error) {
            console.error("Invalid message format", error);
            return;
        }

        console.log('handleMessage: Current players:', this.players);
        const player = Player.findByConnection(this.players, connection);
        if (!player) return;

        // Delegate message handling to the appropriate handler in MessageHandlers
        const handler = this.handlers[data.type];
        if (handler) {
            handler(player, data);
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
