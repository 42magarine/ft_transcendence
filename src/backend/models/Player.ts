import { WebSocket } from "ws";
import { IGameState } from "../../types/interfaces.js";

export class Player {
	private _id: number;
	private _userId: number | null;
	private _score: number = 0;
	private _playing: boolean = false;
	private _connection: WebSocket;
	private _lobbyId: string | null = null

	constructor(connection: WebSocket, id: number, userId: number | null = null) {
		this._connection = connection;
		this._id = id;
		this._userId = userId;
	}

	public sendMessage(data: object): void {
		if (this._connection.readyState === WebSocket.OPEN) {
			this._connection.send(JSON.stringify(data));
		}
	}

	public get id(): number {
		return this._id;
	}

	public get userId(): number | null {
		return this._userId;
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
