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
    private _lobbyName: string;
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
        this._lobbyName = options?.name || `Lobby ${(lobbyId || '000000').substring(0, 6)}`;
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

        // FIXED: Find next available slot instead of using size + 1
        const playerNumber = this.getNextAvailableSlot();
        if (playerNumber === null) {
            return null;
        }

        try {
            // add player to DB via MatchService (type: DB)
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
            // add player to this._players (type: map)
            this._players.set(playerNumber, player);
            // add player to this._game.player1 or player2 (type: PongGame)
            this._game.setPlayer(playerNumber, player);
            // console.log(`Player ${player._playerNumber} (userId: ${player.userId}) join lobby ${this._lobbyId}`);
            return player;
        }
        catch (error) {
            console.error("Error adding player:", error);
            return null;
        }
    }

    public async removePlayer(player: Player): Promise<void> {
        try {
            // Spieler aus DB entfernen
            await this._matchService.removePlayerFromMatch(this._lobbyId, player.userId);

            // Spieler aus Maps entfernen
            this._players.delete(player._playerNumber);
            this._readyPlayers.delete(player._playerNumber);

            // Spieler aus PongGame entfernen
            this._game.removePlayer(player._playerNumber);

            // console.log(`Player ${player._playerNumber} (userId: ${player.userId}) left lobby ${this._lobbyId}`);

            // ADDED: Reposition remaining players
            this.repositionPlayers();

            // Wenn Creator verlässt, neuen Creator bestimmen
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

    // ADDED: Find next available slot (1 or 2)
    private getNextAvailableSlot(): number | null {
        for (let i = 1; i <= this._maxPlayers; i++) {
            if (!this._players.has(i)) {
                return i;
            }
        }
        return null;
    }

    // ADDED: Reposition players to fill slots 1, 2 without gaps
    private repositionPlayers(): void {
        if (this._players.size === 0) {
            return;
        }

        // Get all players and sort by userId for consistency
        const playersArray = Array.from(this._players.values()).sort((a, b) => a.userId - b.userId);

        // Clear maps
        this._players.clear();
        this._readyPlayers.clear();

        // Reassign with consecutive player numbers
        playersArray.forEach((player, index) => {
            const newPlayerNumber = index + 1;
            const oldPlayerNumber = player._playerNumber;

            // Update player number
            player._playerNumber = newPlayerNumber;

            // Re-add to maps
            this._players.set(newPlayerNumber, player);
            if (player._isReady) {
                this._readyPlayers.add(newPlayerNumber);
            }

            // Update in game
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

    public getLobbyId(): string {
        return this._lobbyId;
    }

    public getLobbyState(): ILobbyState {
        return {
            lobbyId: this._lobbyId,
            name: this._lobbyName,
            creatorId: this._creatorId!,
            maxPlayers: this._maxPlayers,
            currentPlayers: this._players.size,
            createdAt: this._createdAt,
            lobbyType: this._lobbyType,
            lobbyPlayers: this.getPlayerStates(),
            isStarted: this._gameStarted
        };
    }

    public getPlayerStates(): IPlayerState[] {
        // FIXED: Sort by playerNumber for consistent frontend display
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
            const winningPlayerId = state.score1 >= this._game._scoreLimit ? 1 : 2;
            const winningPlayer = this._players.get(winningPlayerId);

            this.handleGameWin(winningPlayerId, state.score1, state.score2)
        }

        if (this._matchService) {
            const player1 = this._players.get(1);
            const player2 = this._players.get(2);

            if (player1?.userId && player2?.userId) {
                // if (this._dbGame) {
                const player2User = await this._matchService.userService.findUserById(player2.userId);
                if (player2User) {
                    // this._dbGame.player2 = player2User;
                }
                // this._dbGame.status = 'ongoing'
                // this._dbGame.startedAt = new Date()
                // await this._matchService.saveMatch(this._dbGame)
                // }
                this._saveScoreInterval = setInterval(() => {
                    this.saveCurrentScore();
                }, 10000)
            }
        }
    }  // this._dbGame nicht direkt aufrufen, sondern über funktionen aus MatchService.ts

    //save current score (should only be used for paused game stuff and so on)
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
            await this._matchService.matchRepo.save(game);
        }
        // dont broadcast here! need to move to controller later
        // handle bool gameOver via gamestate
        // this._broadcast(this._lobbyId, {
        //     type: "gameOver",
        //     winnerId: winningPlayerId,
        //     winningUserId: winningPlayer.userId,
        //     player1Score,
        //     player2Score
        // })
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

        // dont broadcast here! need to move to controller later
        // handle bool gamestopped via gamestate
        // this._broadcast(this._lobbyId, {
        //     type: "gameStopped"
        // })
    }
}