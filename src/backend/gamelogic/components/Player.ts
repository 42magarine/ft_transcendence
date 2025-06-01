import { WebSocket } from "ws";
import { UserService } from "../../services/UserService.js";
export class Player {
    public _playerNumber: number;
    public _userId: number;
    public _name: string;
    public _score: number = 0;
    public _playing: boolean = false;
    public _connection: WebSocket;
    public _lobbyId: string;
    public _isReady: boolean = false;
    public _joinedAt: Date;

    constructor(connection: WebSocket, playerNumber: number, userId: number, lobbyId: string, name: string) {
        this._connection = connection;
        this._playerNumber = playerNumber;
        this._userId = userId;
        this._lobbyId = lobbyId;
        this._name = name;
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

    public set lobbyId(value: string) {
        this._lobbyId = value;
    }
}
