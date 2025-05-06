import { WebSocket } from "ws";
import { ServerMessage } from "../../types/ft_types.js";
import { IGameState } from "../../types/interfaces.js";
import { Player } from "./Player.js";
import { PongGame } from "./Pong.js";
import { GameService } from "../services/GameService.js";

export class GameLobby {
	private _id: string;
	private _players: Map<number, Player>;
	private _game: PongGame;
	private _broadcast: (lobbyId: string, data: ServerMessage) => void;
	private _maxPlayers: number = 2;
	private _creatorId: number | null = null;
	private _gameStarted: boolean = false;
	private _gameService: GameService | null = null;

	constructor(id: string, broadcast:( lobbyId: string, data: ServerMessage) => void, gameService?: GameService) {
		this._id = id;
		this._broadcast = broadcast;
		this._gameService = gameService || null;
		this._players = new Map<number, Player>();
		this._game = new PongGame(gameService);
	}

	public addPlayer(
		connection: WebSocket,
		userId?: number
	): Player | null {
		if (this._players.size >= this._maxPlayers) {
			return null;
		}
		const playerNum = this._players.size + 1;

		const player = new Player(connection, playerNum, userId || null);
		player.lobbyId = this._id;

		this._players.set(playerNum, player);

		if (playerNum === 1 && userId) {
			this._creatorId = userId;
		}

		this._game.setPlayer(playerNum as 1 | 2, player)

		if (userId && this._gameService) {
			// this.addLobbyParticipant(userId).catch(console.error);
		}

		this._broadcast(this._id, {
			type: "playerJoined",
			playerId: playerNum,
			playerCount: this._players.size
		})

		return player;
	}

	public removePlayer(player: Player): void {
		this._players.delete(player.id);

		if (this._game.isRunning && !this._game.isPaused) {
			this._game.pauseGame();
		}

		console.log(`Player ${player.id} disconnected`);

		this._broadcast(this._id, {
			type: "playerDisconnected",
			id: player.id,
			playerCount: this._players.size
		});
	}

	public startGame() {
		if (this._players.size < 2 || this._gameStarted)
			return

		this._gameStarted = true;
		this._game.resetScores();
		this._game.resetGame();

		this._game.startGameLoop((data) => {
			this._broadcast(this._id, data)
		})

		this._broadcast(this._id, {
			type: "gameStarted"
		})
	}

	public stopGame() {
		if (!this._gameStarted) {
			return
		}

		this._gameStarted = false;
		this._game.stopGameLoop();

		this._broadcast(this._id, {
			type: "gameStopped"
		})
	}

	// not correct should Invite player to lobby or add player to lobby from current user with different id
	// private async addLobbyParticipant(userId: number): Promise<void> {
	// 	gameId = this._gameService.gameRepo.getGamebyId(userId)
    // }

    /**
     * Check if lobby is full
     */
    public isFull(): boolean {
        return this._players.size >= this._maxPlayers;
    }

    /**
     * Check if lobby is empty
     */
    public isEmpty(): boolean {
        return this._players.size === 0;
    }

    /**
     * Get current game state
     */
    public getGameState(): IGameState {
        return this._game.getState();
    }

    /**
     * Get number of players
     */
    public getPlayerCount(): number {
        return this._players.size;
    }

    /**
     * Get creator ID
     */
    public getCreatorId(): number | null {
        return this._creatorId;
    }

    /**
     * Check if game has started
     */
    public isGameStarted(): boolean {
        return this._gameStarted;
    }

    /**
     * Get player by ID
     */
    public getPlayerById(id: number): Player | undefined {
        return this._players.get(id);
    }

}
