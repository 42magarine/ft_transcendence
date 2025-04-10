import { WebSocket } from "ws";

export class Player {
    public score: number = 0;
    public isPlaying: boolean = true;

    // sollten wir die vaiablen nicht besser explizit erklären?
    // public connection: WebSocket;
    // public id: number;

    // constructor(connection: WebSocket, id: number) {
    //     this.connection = connection;
    //     this.id = id;
    // }
    constructor(
        public connection: WebSocket,
        public id: number
    ) { }

    send(data: object): void {
        if (this.connection.readyState === WebSocket.OPEN) {
            this.connection.send(JSON.stringify(data));
        }
    }

    isConnected(): boolean {
        return this.connection.readyState === WebSocket.OPEN;
    }

    disconnect(): void {
        this.isPlaying = false;
        this.connection.close();
    }

    reconnect(connection: WebSocket): void {
        this.connection = connection;
        this.isPlaying = true;
    }
}

// funktionen sollten als private oder public definiert werden?
