import { WebSocket } from "ws";
import { match } from "assert";
import { ServerMessage } from "../../types/interfaces.js";
import { MatchService } from "../services/MatchService.js";
import { Player } from "../gamelogic/components/Player.js";
import { IGameState } from "../../types/interfaces.js";

export abstract class MatchLobby {
    protected _id: string;
    protected _players: Map<number, Player>;
    protected _broadcast: (lobbyId: string, data: ServerMessage) => void;
    protected _maxPlayers: number = 2;
    protected _creatorId: number | null = null;
    protected _gameStarted: boolean = false;
    protected _matchService: MatchService | null = null;

    constructor(id: string, broadcast:( lobbyId: string, data: ServerMessage) => void, matchService?: MatchService) {
        this._id = id;
        this._broadcast = broadcast;
        this._matchService = matchService || null;
        this._players = new Map<number, Player>();
    }

    public abstract startGame(): void
    public abstract stopGame(): void
    protected abstract onPlayerAdded(player: Player): void
    protected abstract onPlayerRemoved(player: Player): void

    public addPlayer(
        connection: WebSocket,
        userId?: number
    )
    {
        if (this._players.size >= this._maxPlayers) {
            return null
        }

        const playerNum = this._players.size + 1;

        const player = new Player(connection, playerNum, userId || null);
        player.lobbyId = this._id;

        this._players.set(playerNum, player);

        if (playerNum === 1 && userId) {
            this._creatorId = userId;
        }

        this.onPlayerAdded(player);

        this._broadcast(this._id, {
			type: "playerJoined",
			playerId: playerNum,
			playerCount: this._players.size
		})

        return player
    }

    public removePlayer(player: Player): void {
		this._players.delete(player.id);

        this.onPlayerRemoved(player);

		console.log(`Player ${player.id} disconnected`);

		this._broadcast(this._id, {
			type: "playerDisconnected",
			id: player.id,
			playerCount: this._players.size
		});
	}

    public isFull(): boolean {
        return this._players.size >= this._maxPlayers;
    }

    public isEmpty(): boolean {
        return this._players.size === 0;
    }

    public getPlayerCount(): number {
        return this._players.size;
    }

    public getCreatorId(): number | null {
        return this._creatorId;
    }

    public isGameStarted(): boolean {
        return this._gameStarted;
    }
    public getPlayerById(id: number): Player | undefined {
        return this._players.get(id);
    }

    public getId(): string {
        return this._id;
    }
}