import { WebSocket } from "ws";
import { UserService } from "../../services/UserService.js";
export class Player {
    public _playerNumber: number;
    public _userId: number;
    public _name?: Promise <string | null>;
    public _score: number = 0;
    public _playing: boolean = false;
    public _connection: WebSocket;
    public _lobbyId: string | null = null
    public _isReady: boolean = false;
    public _joinedAt: Date;

    constructor(connection: WebSocket, playerNumber: number, userId: number) {
        this._connection = connection;
        this._playerNumber = playerNumber;
        this._userId = userId;
        this._joinedAt = new Date();
    }

    // public sendMessage(data: object): void {
    //     if (this._connection.readyState === WebSocket.OPEN) {
    //         this._connection.send(JSON.stringify(data));
    //     }
    // }

    public get id(): number {
        return this._playerNumber;
    }

    public get userId(): number {
        return this._userId!;
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

    public get lobbyId(): string | null {
        return this._lobbyId;
    }

    public set lobbyId(value: string | null) {
        this._lobbyId = value;
    }
}
