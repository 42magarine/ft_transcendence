import { WebSocket } from "ws";
export declare class Player {
    connection: WebSocket;
    id: number;
    score: number;
    isPlaying: boolean;
    constructor(connection: WebSocket, id: number);
    send(data: object): void;
    isConnected(): boolean;
    disconnect(): void;
    reconnect(connection: WebSocket): void;
}
