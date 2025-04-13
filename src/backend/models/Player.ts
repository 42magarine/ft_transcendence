import { WebSocket } from "ws";
import { ServerMessage } from "../../types/ft_types.js";
import { IGameState } from "../../types/interfaces.js";

export class Player {
    private _id: number;
    private _score: number = 0;
    private _playing: boolean = false;
    private _connection: WebSocket;
    private _broadcast: ((msg: ServerMessage) => void) | null = null;

    constructor(connection: WebSocket, id: number) {
        this._connection = connection;
        this._id = id;
    }

    // === METHODS ===

    public static init(
        connection: WebSocket,
        players: Map<number, Player>,
        getState: () => IGameState,
        sendFallback: (conn: WebSocket, msg: ServerMessage) => void,
        broadcast?: (msg: ServerMessage) => void
    ): Player | null {
        const playerId: number | null = Player.assignPlayerId(players);
        if (!playerId) {
            const errorMsg: ServerMessage = {
                type: "error",
                message: "Game is full"
            };
            sendFallback(connection, errorMsg);
            connection.close();
            return null;
        }

        const player: Player = Player.setupPlayer(connection, playerId, players);
        player._broadcast = broadcast ?? null;
        player.playing = true;

        const assignMsg: ServerMessage = {
            type: "assignPlayer",
            id: playerId,
            state: getState()
        };
        player.sendMessage(assignMsg);

        return player;
    }

    public sendMessage(data: object): void {
        if (this._connection.readyState === WebSocket.OPEN) {
            this._connection.send(JSON.stringify(data));
        }
    }

    public disconnect(): void {
        this._playing = false;
        console.log(`Player ${this._id} disconnected!`);

        if (this._broadcast) {
            const msg: ServerMessage = {
                type: "playerDisconnected",
                id: this._id
            };
            this._broadcast(msg);
        }
    }

    public static findByConnection(players: Map<number, Player>, conn: WebSocket): Player | undefined {
        for (const player of players.values()) {
            if (player.connection === conn) {
                return player;
            }
        }
        return undefined;
    }

    public static assignPlayerId(players: Map<number, Player>): number | null {
        if (!players.has(1)) return 1;
        if (!players.has(2)) return 2;
        return null;
    }

    public static setupPlayer(connection: WebSocket, playerId: number, players: Map<number, Player>): Player {
        const newPlayer: Player = new Player(connection, playerId);
        players.set(playerId, newPlayer);
        return newPlayer;
    }

    // === GETTERS / SETTERS ===

    public get id(): number {
        return this._id;
    }

    public get score(): number {
        return this._score;
    }

    public set score(value: number) {
        this._score = value;
    }

    public get playing(): boolean {
        return this._playing;
    }

    public set playing(value: boolean) {
        this._playing = value;
    }

    public get connection(): WebSocket {
        return this._connection;
    }
}
