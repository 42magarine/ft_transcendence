import { WebSocket, WebSocketServer } from "ws";
import { ServerMessage } from "../types/ft_types.js";

export class Player {
    public score: number = 0;
    public isPlaying: boolean = true;
    public connection: WebSocket;
    public id: number;

    constructor(connection: WebSocket, id: number) {
        this.connection = connection;
        this.id = id;
    }

    public static init(
        connection: WebSocket,
        players: Map<number, Player>,
        getState: () => object,
        sendFallback: (conn: WebSocket, msg: ServerMessage) => void
    ): Player | null {
        const playerId = Player.assignPlayerId(players);
        if (!playerId) {
            sendFallback(connection, {
                type: "error",
                message: "Game is full"
            });
            connection.close();
            return null;
        }

        const player = Player.setupPlayer(connection, playerId, players);
        player.send({
            type: "assignPlayer",
            id: playerId,
            state: getState()
        });

        return player;
    }

    public send(data: object): void {
        if (this.connection.readyState === WebSocket.OPEN) {
            this.connection.send(JSON.stringify(data));
        }
    }

    public isConnected(): boolean {
        return this.connection.readyState === WebSocket.OPEN;
    }

    public disconnect(): void {
        this.isPlaying = false;
        this.connection.close();
    }

    public reconnect(connection: WebSocket): void {
        this.connection = connection;
        this.isPlaying = true;
    }

    public static findByConnection(players: Map<number, Player>, conn: WebSocket): Player | undefined {
        // Debugging to log the connection being checked
        console.log("Finding player for connection:", conn);

        for (const player of players.values()) {
            // Log the player and their connection for debugging
            console.log('Checking player:', player.id, 'Connection:', player.connection);

            // Directly compare the connections using the WebSocket's connection state or ID
            if (player.connection === conn) {
                return player;
            }
        }

        console.error("No player found for the given connection, returning default player.");
        return new Player(conn, 1);
    }


    public static assignPlayerId(players: Map<number, Player>): number | null {
        if (!players.has(1)) return 1;
        if (!players.has(2)) return 2;
        return null;
    }

    public static setupPlayer(connection: WebSocket, playerId: number, players: Map<number, Player>): Player {
        const existingPlayer = players.get(playerId);
        if (existingPlayer && !existingPlayer.isPlaying) {
            existingPlayer.reconnect(connection);
            console.log(`Player ${playerId} reconnected!`);
            return existingPlayer;
        }

        const newPlayer = new Player(connection, playerId);
        players.set(playerId, newPlayer);
        console.log(`Player ${playerId} connected!`);
        return newPlayer;
    }

}

// funktionen sollten als private oder public definiert werden?
