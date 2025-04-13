import { WebSocket } from "ws";

export class Player {
	private _id: number;
	private _score: number = 0;
	private _playing: boolean = false;
	private _connection: WebSocket;

	constructor(connection: WebSocket, id: number) {
		this._connection = connection;
		this._id = id;
	}

	public sendMessage(data: object): void {
		if (this._connection.readyState === WebSocket.OPEN) {
			this._connection.send(JSON.stringify(data));
		}
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
