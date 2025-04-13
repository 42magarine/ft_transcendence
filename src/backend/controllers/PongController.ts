import { WebSocket } from "ws";
import { PongGame } from "../models/Pong.js";
import { Player } from "../models/Player.js";
import { MessageHandlers } from "./MessageHandlers.js";
import { ClientMessage, ServerMessage } from "../../types/ft_types.js";
import { IGameState } from "../../types/interfaces.js";

export class PongController {
    private _game: PongGame;
    private _players: Map<number, Player>;
    private _clients: Set<WebSocket>;
    private _handlers: MessageHandlers;

    constructor() {
        this._game = new PongGame();
        this._players = new Map<number, Player>();
        this._clients = new Set<WebSocket>();
        this._handlers = new MessageHandlers(this._game, this.broadcast.bind(this));
    }

    public handleConnection = (connection: WebSocket): void => {
        console.log("A new client connected!");
        this._clients.add(connection);

        const player: Player | null = Player.init(
            connection,
            this._players,
            (): IGameState => this._game.getState(),
            (conn: WebSocket, msg: ServerMessage): void => this.sendMessage(conn, msg),
            this.broadcast.bind(this)
        );

        if (!player) return;

        connection.on("message", (message: string | Buffer): void =>
            this.handleMessage(message, connection)
        );

        connection.on("close", (): void => {
            this.handleClose(connection, player);
        });
    };

    private handleMessage(message: string | Buffer, connection: WebSocket): void {
        let data: ClientMessage;
        try {
            data = JSON.parse(message.toString()) as ClientMessage;
        }
        catch (error: unknown) {
            console.error("Invalid message format", error);
            return;
        }

        const player: Player | undefined = Player.findByConnection(this._players, connection);
        if (!player) return;

        const handler = this._handlers[data.type];
        if (handler) {
            handler(player, data);
        }
    }

    private sendMessage(connection: WebSocket, data: ServerMessage): void {
        if (connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify(data));
        }
    }

    private handleClose(connection: WebSocket, player: Player): void {
        this._clients.delete(connection);
        player.disconnect();
    }

    private broadcast(data: ServerMessage): void {
        const message: string = JSON.stringify(data);
        this._clients.forEach((client: WebSocket): void => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}
