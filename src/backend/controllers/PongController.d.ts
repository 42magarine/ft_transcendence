import { WebSocket } from "ws";
export declare class PongController {
    private game;
    private players;
    private intervalId;
    private clients;
    private isRunning;
    handleConnection: (connection: WebSocket) => void;
    private setupPlayer;
    private handleMessage;
    private getPlayerByConnection;
    private assignPlayerId;
    private startGameLoop;
    private stopGameLoop;
    private broadcast;
    private sendMessage;
}
