import { WebSocket } from "ws";
import { ILobbyState, IPlayerState, IServerMessage } from "../../interfaces/interfaces.js";
import { MatchService } from "../services/MatchService.js";
import { Player } from "../gamelogic/components/Player.js";
import { IGameState } from "../../interfaces/interfaces.js";
import { PongGame } from "../gamelogic/Pong.js";

export class MatchLobby {
    private _game: PongGame;
    private _gameId!: number;
    private _saveScoreInterval: NodeJS.Timeout | null = null;
    private _lobbyId: string;
    public _players: Map<number, Player>;
    private _maxPlayers: number;
    private _gameStarted: boolean = false;
    private _createdAt: Date;
    private _lobbyType: 'game' | 'tournament';
    private _readyPlayers: Set<number> = new Set();
    private _creatorId!: number;
    private _matchService: MatchService;
    private _broadcast: (data: IServerMessage) => void;

    constructor(lobbyId: string,
        matchService: MatchService,
        broadcast: (data: IServerMessage) => void,
        options?: {
            name?: string,
            maxPlayers?: number,
            lobbyType?: 'game' | 'tournament'
        }) {
        this._lobbyId = lobbyId;
        this._matchService = matchService!;
        this._players = new Map<number, Player>();
        this._maxPlayers = options?.maxPlayers || 2;
        this._createdAt = new Date();
        this._lobbyType = options?.lobbyType || 'game';
        this._broadcast = broadcast;
        this._game = new PongGame(broadcast, matchService);
    }

    public getGameState(): IGameState {
        return this._game.getState();
    }

    public getGameId(): number | null {
        return this._gameId;
    }

    public async addPlayer(connection: WebSocket, userId: number): Promise<Player | null> {
        if (this._players.size >= this._maxPlayers) {
            return null;
        }

        const playerNumber = this.getNextAvailableSlot();
        if (playerNumber === null) {
            return null;
        }

        try {
            if (playerNumber === 1) {
                await this._matchService.createMatch(this._lobbyId, userId);
                this._creatorId = userId;
            }
            else if (playerNumber === 2) {
                const success = await this._matchService.addPlayerToMatch(this._lobbyId, userId);
                if (!success) {
                    return null;
                }
            }
            const user = await this._matchService.userService.findUserById(userId);
            if (!user) {
                return null;
            }
            const player = new Player(connection, playerNumber, userId, this._lobbyId, user.username);
            this._players.set(playerNumber, player);
            this._game.setPlayer(playerNumber, player);
            return player;
        }
        catch (error) {
            console.error("Error adding player:", error);
            return null;
        }
    }

    public async removePlayer(player: Player): Promise<void> {
        try {
            await this._matchService.removePlayerFromMatch(this._lobbyId, player.userId);
            this._players.delete(player._playerNumber);
            this._readyPlayers.delete(player._playerNumber);
            this._game.removePlayer(player._playerNumber);

            this.repositionPlayers();

            if (this._creatorId === player.userId && this._players.size > 0) {
                const nextPlayer = this._players.values().next().value;

                if (nextPlayer && nextPlayer.userId) {
                    this._creatorId = nextPlayer.userId;
                }
            }
        }
        catch (error) {
            console.error("Error removing player from lobby:", error);
            throw error;
        }
    }

    private getNextAvailableSlot(): number | null {
        for (let i = 1; i <= this._maxPlayers; i++) {
            if (!this._players.has(i)) {
                return i;
            }
        }
        return null;
    }

    private repositionPlayers(): void {
        if (this._players.size === 0) {
            return;
        }

        const playersArray = Array.from(this._players.values()).sort((a, b) => a.userId - b.userId);

        this._players.clear();
        this._readyPlayers.clear();

        playersArray.forEach((player, index) => {
            const newPlayerNumber = index + 1;
            const oldPlayerNumber = player._playerNumber;

            player._playerNumber = newPlayerNumber;

            this._players.set(newPlayerNumber, player);
            if (player._isReady) {
                this._readyPlayers.add(newPlayerNumber);
            }

            this._game.removePlayer(oldPlayerNumber);
            this._game.setPlayer(newPlayerNumber, player);
        });
    }

    public setPlayerReady(playerId: number, isReady: boolean) {
        const player = this._players.get(playerId);
        if (!player) {
            return;
        }

        player._isReady = isReady;
        if (isReady) {
            this._readyPlayers.add(playerId)
        }
        else {
            this._readyPlayers.delete(playerId);
        }
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

    public getLobbyState(): ILobbyState {
        return {
            lobbyId: this._lobbyId,
            maxPlayers: this._maxPlayers,
            currentPlayers: this._players.size,
            lobbyType: this._lobbyType,
            lobbyPlayers: this.getPlayerStates(),
            isStarted: this._gameStarted,
            gameIsOver: this._game.isGameOver
        };
    }

    public getPlayerStates(): IPlayerState[] {
        return Array.from(this._players.values())
            .sort((a, b) => a._playerNumber - b._playerNumber)
            .map(p => ({
                playerNumber: p._playerNumber,
                userId: p._userId,
                userName: p._name,
                isReady: p._isReady
            }));
    }

    /* GAME LOGIC FROM HERE */

    public async startGame() {
        this._gameStarted = true;
        this._game.resetScores();
        this._game.resetGame();

        this._game.startGameLoop()

        const state = this.getGameState();

        if (state.score1 >= this._game._scoreLimit || state.score2 >= this._game._scoreLimit) {

            this.handleGameWin(state.score1, state.score2)
        }

        if (this._matchService) {
            const player1 = this._players.get(1);
            const player2 = this._players.get(2);

            if (player1?.userId && player2?.userId) {
                const game = await this._matchService.getMatchById(this._gameId)
                if (game) {
                    game.status = 'ongoing'
                    game.startedAt = new Date()
                    await this._matchService.matchRepo.save(game);
                }
                this._saveScoreInterval = setInterval(() => {
                    this.saveCurrentScore();
                }, 10000)
            }
        }
    }

    private async saveCurrentScore() {
        if (!this._gameId || !this._matchService) {
            return;
        }

        const state = this._game.getState();
        await this._matchService.updateScore(this._gameId, state.score1, state.score2, 0)
    }

    private async handleGameWin(player1Score: number, player2Score: number) {
        this.stopGame();

        await this._matchService.updateScore(
            this._gameId,
            player1Score,
            player2Score,
            this._game.winner?.userId
        )

        const game = await this._matchService.getMatchById(this._gameId)
        if (game) {
            game.status = 'completed'
            game.endedAt = new Date()
            await this._matchService.matchRepo.save(game);
        }
    }

    public async stopGame() {
        if (!this._gameStarted) {
            return;
        }

        this._gameStarted = false;
        this._game.stopGameLoop();

        if (this._saveScoreInterval) {
            clearInterval(this._saveScoreInterval);
            this._saveScoreInterval = null;
        }

        await this.saveCurrentScore();

        if (this._gameId && this._matchService) {
            this._matchService.getMatchById(this._gameId).then(game => {
                if (game && game.status !== 'completed') {
                    game.status = 'cancelled',
                        game.endedAt = new Date();
                    this._matchService.matchRepo.save(game);
                }
            })
        }
    }

    public get game(): PongGame {
        return this._game;
    }

    public get lobbyId(): string {
        return this._lobbyId;
    }
}
