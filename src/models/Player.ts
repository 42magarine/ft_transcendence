import { WebSocket } from "ws";

export class Player {
    public score: number = 0;
    public isPlaying: boolean = true;
    public connection: WebSocket;
    public id: number;

    constructor(connection: WebSocket, id: number) {
        this.connection = connection;
        this.id = id;
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
