import { WebSocket } from "ws";
import { ServerMessage } from "../../types/ft_types.js";
import { IGameState } from "../../types/interfaces.js";
import { Player } from "./Player.js";

export class GameLobby {
	private _players: Map<number, Player>;
	private _broadcast: (msg: ServerMessage) => void;

	constructor(broadcast: (msg: ServerMessage) => void) {
		this._players = new Map();
		this._broadcast = broadcast;
	}

	public addPlayer(
		connection: WebSocket,
		getState: () => IGameState,
		sendFallback: (conn: WebSocket, msg: ServerMessage) => void
	): Player | null {
		const playerId = this.assignPlayerId();
		if (!playerId) {
			const errorMsg: ServerMessage = {
				type: "error",
				message: "Game is full"
			};
			sendFallback(connection, errorMsg);
			connection.close();
			return null;
		}

		const player = new Player(connection, playerId);
		player.playing = true;
		this._players.set(playerId, player);

		const assignMsg: ServerMessage = {
			type: "assignPlayer",
			id: playerId,
			state: getState()
		};
		player.sendMessage(assignMsg);

		this._broadcast({
			type: "playerConnected",
			id: playerId
		});

		return player;
	}

	public removePlayer(player: Player): void {
		player.playing = false;
		this._players.delete(player.id);

		console.log(`Player ${player.id} disconnected`);

		this._broadcast({
			type: "playerDisconnected",
			id: player.id
		});
	}

	public getPlayerByConnection(conn: WebSocket): Player | undefined {
		for (const player of this._players.values()) {
			if (player.connection === conn) {
				return player;
			}
		}
		return undefined;
	}

	private assignPlayerId(): number | null {
		if (!this._players.has(1)) return 1;
		if (!this._players.has(2)) return 2;
		return null;
	}
}
