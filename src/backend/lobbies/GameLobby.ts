import { WebSocket } from "ws";
import { ServerMessage, GameStateMessage } from "../../types/interfaces.js";
import { IGameState } from "../../types/interfaces.js";
import { Player } from "../gamelogic/components/Player.js";
import { PongGame } from "../gamelogic/Pong.js";
import { GameService } from "../services/GameService.js";
import { MatchLobby } from "./MatchLobby.js";
import game from "../../routes/game.js";
import { randomUUID } from "crypto";

export class GameLobby extends MatchLobby{
	private _game: PongGame;
	private _gameService: GameService | null = null;
	private _gameId: number | null = null
	private _saveScoreInterval: NodeJS.Timeout | null = null;

	constructor(
		id: string,
		broadcast:( lobbyId: string, data: ServerMessage) => void,
		gameService?: GameService,
		options?: {
			name?: string,
			maxPlayers?: number,
			isPublic?: boolean,
			password?: string
		}) {
		super(id, broadcast, gameService, {
			...options,
			maxPlayers: 2,
			lobbyType: 'game'
		})
		this._gameService = gameService || null;
		this._game = new PongGame(gameService);
	}

	protected onPlayerAdded(player: Player): void {
		this._game.setPlayer(player.id as 1 | 2, player);
	}

	protected onPlayerRemoved(player: Player): void {
		if (this._game.isRunning && !this._game.isPaused) {
			this._game.pauseGame();
		}
	}

	public async startGame() {
		if (this._players.size < 2 || this._gameStarted)
			return

		this._gameStarted = true;
		this._game.resetScores();
		this._game.resetGame();

		this._game.startGameLoop((data) => {

			if (data.type === "gameUpdate")
			{
				const state = data.state;

				if (state.score1 >= this._game._scoreLimit || state.score2 >= this._game._scoreLimit)
				{
					const winningPlayerId = state.score1 >= this._game._scoreLimit ? 1 : 2;
					const winningPlayer = this._players.get(winningPlayerId);

					this.handleGameWin(winningPlayerId, state.score1, state.score2)
				}
			}
			this._broadcast(this._id, data)
		})

		this._broadcast(this._id, {
			type: "gameStarted"
		})

		if (this._gameService) {
			const player1 = this._players.get(1);
			const player2 = this._players.get(2);

			if (player1?.userId && player2?.userId)
			{
				const game = await this._gameService.createGame(player1.userId, player2.userId)
				this._gameId = game.id;

				this._saveScoreInterval = setInterval(() => {
					this.saveCurrentScore();
				}, 10000)
			}
		}
	}

	private async saveCurrentScore()
	{
		if (!this._gameId || !this._gameService)
		{
			return;
		}

		const state = this._game.getState();
		await this._gameService.updateGameScore(this._gameId, state.score1, state.score2)
	}

	private async handleGameWin(winningPlayerId: number, player1Score: number, player2Score: number)
	{
		this.stopGame();

		const winningPlayer = this._players.get(winningPlayerId);
		if (!winningPlayer?.userId || !this._gameId || !this._gameService)
			return;

		await this._gameService.updateGameScore(
			this._gameId,
			player1Score,
			player2Score,
			winningPlayer.userId
		)

		this._broadcast(this._id, {
			type: "gameOver",
			winnerId: winningPlayerId,
			winningUserId: winningPlayer.userId,
			player1Score,
			player2Score
		})
	}

	public resumeGame() {
		if (this._game.isPaused)
		{
			this._game.resumeGame()

			this._broadcast(this._id, {
				type: "gameResumed"
			})
		}
	}


	public pauseGame() {
		if (!this._gameStarted || this._game.isPaused)
			return;

		this._game.pauseGame();

		this.saveCurrentScore();

		this._broadcast(this._id, {
			type: "gamePaused"
		})
	}

	public async stopGame() {
		if (!this._gameStarted) {
			return
		}

		this._gameStarted = false;
		this._game.stopGameLoop();

		if (this._saveScoreInterval) {
			clearInterval(this._saveScoreInterval)
			this._saveScoreInterval = null;
		}

		await this.saveCurrentScore();

		this._broadcast(this._id, {
			type: "gameStopped"
		})
	}

	public getGameState(): IGameState {
		return this._game.getState();
	}

	public getGameId(): number | null {
		return this._gameId;
	}
}
