import { WebSocket } from "ws";

export class Player {
	public score: number = 0;

	constructor(
		public connection: WebSocket,
		public id: number
	) {}

	send(data: object) {
		if (this.connection.readyState === WebSocket.OPEN) {
			this.connection.send(JSON.stringify(data));
		}
	}

	isConnected(): boolean {
		return this.connection.readyState === WebSocket.OPEN;
	}
}
