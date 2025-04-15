import { WebSocket } from "ws";
export class Player {
    connection;
    id;
    score = 0;
    isPlaying = true;
    // sollten wir die vaiablen nicht besser explizit erklären?
    // public connection: WebSocket;
    // public id: number;
    // constructor(connection: WebSocket, id: number) {
    //     this.connection = connection;
    //     this.id = id;
    // }
    constructor(connection, id) {
        this.connection = connection;
        this.id = id;
    }
    send(data) {
        if (this.connection.readyState === WebSocket.OPEN) {
            this.connection.send(JSON.stringify(data));
        }
    }
    isConnected() {
        return this.connection.readyState === WebSocket.OPEN;
    }
    disconnect() {
        this.isPlaying = false;
        this.connection.close();
    }
    reconnect(connection) {
        this.connection = connection;
        this.isPlaying = true;
    }
}
// funktionen sollten als private oder public definiert werden?
