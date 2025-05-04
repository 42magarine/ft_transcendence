import { WebSocket } from "ws";
import { match } from "assert";
import { ServerMessage } from "../../types/interfaces.js";
import { MatchService } from "../services/MatchService.js";
import { Player } from "../gamelogic/components/Player.js";
import { IGameState } from "../../types/interfaces.js";
import { isReadable } from "stream";

export abstract class MatchLobby {
    protected _id: string;
    protected _players: Map<number, Player>;
    protected _broadcast: (lobbyId: string, data: ServerMessage) => void;
    protected _maxPlayers: number;
    protected _gameStarted: boolean = false;
    protected _lobbyName: string;
    protected _isPublic: boolean;
    protected _createdAt: Date;
    protected _lobbyType: 'game' | 'tournament'
    protected _password?: string
    protected _readyPlayers: Set<number> = new Set();
    protected _creatorId: number | null = null;
    protected _matchService: MatchService | null = null;

    constructor(id: string,
        broadcast:( lobbyId: string, data: ServerMessage) => void,
        matchService?: MatchService,
        options?: {
            name?:string,
            maxPlayers?:number,
            isPublic?:boolean,
            password?:string,
            lobbyType?: 'game' | 'tournament'
        }) {
        this._id = id;
        this._broadcast = broadcast;
        this._matchService = matchService || null;
        this._players = new Map<number, Player>();
        this._maxPlayers = options?.maxPlayers || 2;
        this._isPublic = options?.isPublic || true;
        this._password = options?.password
        this._lobbyName = options?.name || `Lobby ${id.substring(0,6)}`
        this._createdAt = new Date();
        this._lobbyType = options?.lobbyType || 'game';
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
        if (this._players.size >= this._maxPlayers || this._gameStarted) {
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
			playerCount: this._players.size,
            playerInfo: {
                id: playerNum,
                userId: player.userId,
                isReady: player._isReady
            }
		})

        const playerList = this.getPlayerList()

        connection.send(JSON.stringify({
            type: "lobbyInfo",
            id: this._id,
            name: this._lobbyName,
            players: playerList,
            creatorId: this._creatorId,
            maxPlayers: this._maxPlayers,
            lobbyType: this._lobbyType
        }))

        return player
    }

    public removePlayer(player: Player): void {
		this._players.delete(player.id);
        this._readyPlayers.delete(player.id);
        this.onPlayerRemoved(player);

		console.log(`Player ${player.id} disconnected`);

		this._broadcast(this._id, {
			type: "playerDisconnected",
			id: player.id,
			playerCount: this._players.size
		});

        if (this._creatorId === player.userId && this._players.size > 0)
        {
            const nextPlayer = this._players.values().next().value;

            if (nextPlayer && nextPlayer.userId)
            {
                this._creatorId = nextPlayer.userId;
                this._broadcast(this._id, {
                    type: "newCreator",
                    creatorId: this._creatorId,
                    creatorPlayerId: nextPlayer.id
                })
            }
        }
	}

    public setPlayerReady(playerId: number, isReady: boolean){
        const player = this._players.get(playerId)
        if (!player) return

        player._isReady = isReady;
        if(isReady)
        {
            this._readyPlayers.add(playerId)
        } else
        {
            this._readyPlayers.delete(playerId);
        }

        this._broadcast(this._id, {
            type: "playerReady",
            playerId: playerId,
            ready: isReady,
            readyCount: this._readyPlayers.size
        })

        this.checkAllPlayersReady();

    }

    protected checkAllPlayersReady()
    {
        const minPlayers = this._lobbyType === 'game' ? 2 : this._maxPlayers;

        if (this._players.size < minPlayers) return false;

        const allReady = this._readyPlayers.size === this._players.size;

        if (allReady)
        {
            this._broadcast(this._id , {
                type: "allPlayersReady"
            })
        }

        return allReady;
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

    public getLobbyInfo() {
        return {
            id: this._id,
            name: this._lobbyName,
            creatorId: this._creatorId,
            maxPlayers: this._maxPlayers,
            currentPlayers: this._players.size,
            isPublic: this._isPublic,
            hasPassword: !!this._password,
            createdAt: this._createdAt,
            lobbyType: this._lobbyType,
            isStarted: this._gameStarted
        }
    }

    public getPlayerList() {
        return Array.from(this._players.values()).map(p => ({
            id: p.id,
            userId: p.userId,
            isReady: p._isReady
        }))
    }

    public canJoin(userId: number, password?: string) {
        if (this.isFull() || this._gameStarted) return false;
        if (this._password && this._password !== password) return false;

        for (const player of this._players.values())
        {
            if (player.userId === userId) return false;
        }

        return true;
    }
}