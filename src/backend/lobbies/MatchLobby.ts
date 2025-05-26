import { WebSocket } from "ws";
import { LobbyInfo, ServerMessage } from "../../interfaces/interfaces.js";
import { MatchService } from "../services/MatchService.js";
import { Player } from "../gamelogic/components/Player.js";
import { IGameState } from "../../interfaces/interfaces.js";
import { PongGame } from "../gamelogic/Pong.js";
import { MatchModel } from "../models/MatchModel.js";

export class MatchLobby {
    protected _game: PongGame;
    protected _gameId: number | null = null
    protected _saveScoreInterval: NodeJS.Timeout | null = null;
    protected _dbGame: MatchModel | null = null
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
        broadcast: (lobbyId: string, data: ServerMessage) => void,
        matchService?: MatchService,
        options?: {
            name?: string,
            maxPlayers?: number,
            isPublic?: boolean,
            password?: string,
            lobbyType?: 'game' | 'tournament'
        }) {
        this._id = id;
        this._broadcast = broadcast;
        this._matchService = matchService || null;
        this._players = new Map<number, Player>();
        this._maxPlayers = options?.maxPlayers || 2;
        this._isPublic = options?.isPublic || true;
        this._password = options?.password
        this._lobbyName = options?.name || `Lobby ${id.substring(0, 6)}`
        this._createdAt = new Date();
        this._lobbyType = options?.lobbyType || 'game';
        this._game = new PongGame(matchService);
    }

    protected onPlayerAdded(player: Player): void {
        if (player.id <= 2) {
            this._game.setPlayer(player.id as 1 | 2, player);
        }
        this.updateLobbyParticipants();
    }

    protected onPlayerRemoved(player: Player): void {
        if (this._game.isRunning && !this._game.isPaused) {
            this._game.pauseGame();
        }
    }

    private async updateLobbyParticipants() {
        if (!this._matchService) {
            return;
        }

        if (!this._dbGame && this._players.size > 0) {
            const creatorPlayer = Array.from(this._players.values())
                .find(p => p.userId === this._creatorId)

            if (creatorPlayer && creatorPlayer.userId) {
                this._dbGame = await this._matchService.createMatch(
                    creatorPlayer.userId,
                    creatorPlayer.userId //to fill db on creation -> overwrite later wiht user2
                )
            }

            if (this._dbGame) {
                this._gameId = this._dbGame.id
            }
        }

        if (this._dbGame && this._gameId) {
            for (const player of this._players.values()) {
                if (player.userId) {
                    await this._matchService.addLobbyParticipant(this._gameId, player.userId)
                }
            }
        }
    }

    public async startGame() {
        if (this._players.size < 2 || this._gameStarted) {
            return;
        }

        this._gameStarted = true;
        this._game.resetScores();
        this._game.resetGame();

        this._game.startGameLoop((data) => {

            if (data.type === "gameUpdate") {
                const state = data.state;

                if (state.score1 >= this._game._scoreLimit || state.score2 >= this._game._scoreLimit) {
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

        if (this._matchService) {
            const player1 = this._players.get(1);
            const player2 = this._players.get(2);

            if (player1?.userId && player2?.userId) {
                if (!this._gameId) {
                    const game = await this._matchService.createMatch(player1.userId, player2.userId)
                    this._gameId = game.id;
                    this._dbGame = game;
                }
                else if (this._dbGame) {
                    const player2User = await this._matchService.userService.findUserById(player2.userId);
                    if (player2User) {
                        this._dbGame.player2 = player2User;
                    }
                    this._dbGame.status = 'ongoing'
                    this._dbGame.startedAt = new Date()
                    await this._matchService.saveMatch(this._dbGame)
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

    private async handleGameWin(winningPlayerId: number, player1Score: number, player2Score: number) {
        this.stopGame();

        const winningPlayer = this._players.get(winningPlayerId);
        if (!winningPlayer?.userId || !this._gameId || !this._matchService) {
            return;
        }

        await this._matchService.updateScore(
            this._gameId,
            player1Score,
            player2Score,
            winningPlayer.userId
        )

        const game = await this._matchService.getMatchById(this._gameId)
        if (game) {
            game.status = 'completed'
            game.endedAt = new Date()
            await this._matchService.saveMatch(game)
        }

        this._broadcast(this._id, {
            type: "gameOver",
            winnerId: winningPlayerId,
            winningUserId: winningPlayer.userId,
            player1Score,
            player2Score
        })
    }

    public resumeGame() {
        if (this._game.isPaused) {
            this._game.resumeGame()

            if (this._gameId && this._matchService) {
                this._matchService.getMatchById(this._gameId).then(game => {
                    if (game) {
                        game.status = 'ongoing',
                            this._matchService?.saveMatch(game);
                    }
                })
            }

            this._broadcast(this._id, {
                type: "gameResumed"
            })
        }
    }

    public pauseGame() {
        if (!this._gameStarted || this._game.isPaused) {
            return;
        }

        this._game.pauseGame();
        this.saveCurrentScore();

        if (this._gameId && this._matchService) {
            this._matchService.getMatchById(this._gameId).then(game => {
                if (game) {
                    game.status = 'paused',
                        this._matchService?.saveMatch(game);
                }
            })
        }

        this._broadcast(this._id, {
            type: "gamePaused"
        })
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
                    this._matchService?.saveMatch(game);
                }
            })
        }

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

    public addPlayer(
        connection: WebSocket,
        userId?: number
    ) {
        if (this._players.size >= this._maxPlayers || this._gameStarted) {
            return null;
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

        const playerList = this.getPlayerList();

        connection.send(JSON.stringify({
            type: "lobbyInfo",
            id: this._id,
            name: this._lobbyName,
            players: playerList,
            creatorId: this._creatorId,
            maxPlayers: this._maxPlayers,
            lobbyType: this._lobbyType
        }))

        return player;
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

        if (this._creatorId === player.userId && this._players.size > 0) {
            const nextPlayer = this._players.values().next().value;

            if (nextPlayer && nextPlayer.userId) {
                this._creatorId = nextPlayer.userId;
                this._broadcast(this._id, {
                    type: "newCreator",
                    creatorId: this._creatorId,
                    creatorPlayerId: nextPlayer.id
                })
            }
        }
    }

    public setPlayerReady(playerId: number, isReady: boolean) {
        const player = this._players.get(playerId);
        if (!player) {
            return;
        }

        player._isReady = isReady;
        if (isReady) {
            this._readyPlayers.add(playerId)
        } else {
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

    public checkAllPlayersReady() {
        const minPlayers = this._lobbyType === 'game' ? 2 : this._maxPlayers;

        if (this._players.size < minPlayers) {
            return false;
        }

        const allReady = this._readyPlayers.size === this._players.size;

        if (allReady) {
            this._broadcast(this._id, {
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

    public getLobbyInfo(): LobbyInfo {
        return {
            id: this._id,
            name: this._lobbyName,
            creatorId: this._creatorId!,
            maxPlayers: this._maxPlayers,
            currentPlayers: this._players.size,
            isPublic: this._isPublic,
            hasPassword: !!this._password,
            createdAt: this._createdAt,
            lobbyType: this._lobbyType,
            isStarted: this._gameStarted
        };
    }

    public getPlayerList() {
        return Array.from(this._players.values()).map(p => ({
            id: p.id,
            userId: p.userId,
            isReady: p._isReady
        }));
    }

    public canJoin(userId: number, password?: string) {
        if (this.isFull() || this._gameStarted) {
            return false;
        }
        if (this._password && this._password !== password) {
            return false;
        }

        for (const player of this._players.values()) {
            if (player.userId === userId) return false;
        }
        return true;
    }
}
// https://meta.intra.42.fr/
