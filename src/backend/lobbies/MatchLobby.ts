import { WebSocket } from "ws";
import { ILobbyState, IPlayerState, IServerMessage } from "../../interfaces/interfaces.js";
import { MatchService } from "../services/MatchService.js";
import { Player } from "../gamelogic/components/Player.js";
import { IGameState } from "../../interfaces/interfaces.js";
import { PongGame } from "../gamelogic/Pong.js";
import Pong from "../../frontend/views/Pong.js";

export class MatchLobby {
    private _games: Map<number, PongGame> = new Map();
    private _gameId!: number;
    private _saveScoreInterval: NodeJS.Timeout | null = null;
    private _lobbyId: string;
    public _players: Map<number, Player>;
    public _maxPlayers: number;
    private _gameStarted: boolean = false;
    private _lobbyName: string;
    private _createdAt: Date;
    public  _lobbyType: 'game' | 'tournament';
    private _readyPlayers: Set<number> = new Set();
    private _creatorId!: number;
    private _matchService: MatchService;
    private _broadcast: (data: IServerMessage) => void;

    private _tournamentId: number | null = null;
    private _tournamentStatus: 'pending' | 'ongoing' | 'completed' | 'cancelled' = 'pending';
    private _currentRound: number = 0;
    private _tournamentSchedule: ITournamentRound[] = [];
    private _playerPoints: Map<number,number> = new Map();

    private _gameBroadCastInterval: NodeJS.Timeout | null = null;

    constructor(lobbyId: string,
        matchService: MatchService,
        broadcast: (data: IServerMessage) => void,
        options?: {
            name?: string,
            maxPlayers?: number,
            lobbyType?: 'game' | 'tournament',
            tournamentId?: number,
            tournamentStatus?: 'pending' | 'ongoing' | 'completed' | 'cancelled',
            currentRound?: number,
            playerPoints?: { [userId: number]: number },
            matchSchedule?: ITournamentRound[]

        }) {
        this._lobbyId = lobbyId;
        this._matchService = matchService!;
        this._players = new Map<number, Player>();
        this._maxPlayers = options?.maxPlayers || 2;
        this._lobbyName = options?.name || `Lobby ${(lobbyId || '000000').substring(0, 6)}`;
        this._createdAt = new Date();
        this._lobbyType = options?.lobbyType || 'game';
        this._broadcast = broadcast;

        if (this._lobbyType === 'tournament')
        {
            this._tournamentId = options?.tournamentId || null;
            this._tournamentStatus = options?.tournamentStatus || 'pending';
            this._currentRound = options?.currentRound || 0;
            if (options?.playerPoints)
            {
                this._playerPoints = new Map(Object.entries(options.playerPoints).map(([key, value]) => [Number(key), value]))
            }
            this._tournamentSchedule = options?.matchSchedule || []

            if (this._maxPlayers < 4 || this._maxPlayers > 8)
            {
                this._maxPlayers = 8;
            }
        }
    }

    public getGameState(matchId: number): IGameState | null {
        const game = this._games.get(matchId)
        return game ? game.getState() : null;
    }

    public getAllActiveGames(): IGameState[]
    {
        return Array.from(this._games.values()).map(game => game.getState());
    }

    public getPongGame(matchId: number): PongGame | undefined
    {
        return this._games.get(matchId);
    }

    public getGameId(): number | null {
        if (this._games.size > 0)
        {
            return Array.from(this._games.keys())[0];
        }
        return null;
    }

    public getTournamentId(): number | null
    {
        return this._tournamentId;
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
            const user = await this._matchService.userService.findUserById(userId);
            if (!user) {
                return null;
            }
            const player = new Player(connection, playerNumber, userId, this._lobbyId, user.username);
            this._players.set(playerNumber, player);

            if (this._lobbyType === 'tournament' && !this._playerPoints.has(userId))
            {
                this._playerPoints.set(userId,0);
            }

            if (this._lobbyType === 'game')
            {
                if (playerNumber === 1) {
                    const newMatch = await this._matchService.createMatch(this._lobbyId, userId, this._maxPlayers, this._lobbyName);
                    const game = new PongGame(this.handleGameEndCallback.bind(this, newMatch.matchModelId));
                    game.setMatchId(newMatch.matchModelId); // Set the match ID
                    this._games.set(newMatch.matchModelId, game);
                    game.setPlayer(1, player);
                    this._creatorId = userId;
                } else if (playerNumber === 2) {
                    await this._matchService.addPlayerToMatch(this._lobbyId, userId);
                    const match = await this._matchService.getMatchById(this.getGameId()!);
                    if (match && this._games.has(match.matchModelId)) {
                        this._games.get(match.matchModelId)?.setPlayer(2, player);
                    }
                }
            } else if (this._lobbyType === 'tournament' && playerNumber === 1) {
                if (!this._tournamentId) {
                    const tournament = await this._matchService.createTournament(this._lobbyId, userId, this._maxPlayers, this._lobbyName);
                    this._tournamentId = tournament.id;
                    this._creatorId = userId;
                    await this._matchService.addPlayerToTournament(tournament.id, userId);
                }
            } else if (this._lobbyType === 'tournament' && this._tournamentId) {
                await this._matchService.addPlayerToTournament(this._tournamentId, userId);
            }

            return player;
        } catch (error) {
            console.error("Error adding player:", error);
            return null;
        }
    }

    public async removePlayer(player: Player): Promise<void> {
        try {
            // First, remove the player from the lobby's internal map
            this._players.delete(player._playerNumber);
            this._readyPlayers.delete(player.userId); // Use userId for readyPlayers set

            // If it's a tournament, cancel the entire tournament
            if (this._lobbyType === 'tournament') {
                console.log(`Player ${player._name} left tournament lobby ${this._lobbyId}. Cancelling tournament.`);
                await this.cancelTournament("A player left the tournament.");
            } else {
                // For regular game, clean up player and potentially the single game
                await this._matchService.removePlayerFromMatch(this._lobbyId, player.userId);

                // Stop any games they are currently in (for regular games)
                for (const [matchId, game] of this._games.entries()) {
                    if (game.player1?._userId === player.userId || game.player2?._userId === player.userId) {
                        game.stopGameLoop();
                        this._games.delete(matchId);
                        // Mark the match in DB as cancelled
                        await this._matchService.updateMatchStatus(matchId, 'cancelled');
                    }
                }
            }

            this.repositionPlayers(); // Re-assign player numbers for remaining players

            // Reassign creator if the creator left
            if (this._creatorId === player.userId && this._players.size > 0) {
                const nextPlayer = this._players.values().next().value;
                if (nextPlayer && nextPlayer.userId) {
                    this._creatorId = nextPlayer.userId;
                }
            }

        } catch (error) {
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
        this._games.forEach(game => game.clearPlayers()); // Clear players from game instances

        playersArray.forEach((player, index) => {
            const newPlayerNumber = index + 1;
            player._playerNumber = newPlayerNumber;
            this._players.set(newPlayerNumber, player);
            if (player._isReady) {
                this._readyPlayers.add(player.userId);
            }
        });
    }

    public setPlayerReady(userId: number, isReady: boolean) {
        const player = Array.from(this._players.values()).find(p => p.userId === userId);
        if (!player) {
            return;
        }

        player._isReady = isReady;
        if (isReady) {
            this._readyPlayers.add(userId)
        }
        else {
            this._readyPlayers.delete(userId);
        }

        const allPlayersReady = this._readyPlayers.size === this._players.size;
        if (this._lobbyType === 'tournament' && this._players.size >= 4 && allPlayersReady && !this._gameStarted && this._tournamentStatus === 'pending') {
            this.startTournament();
        } else if (this._lobbyType === 'game' && this._players.size === this._maxPlayers && allPlayersReady && !this._gameStarted) {
            this.startGame();
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
        let player = Array.from(this._players.values()).find(p => p.userId === id);
        if (!player) {
            player = this._players.get(id);
        }
        return player;
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
            isStarted: this._gameStarted,
            tournamentStatus: this._tournamentStatus,
            currentRound: this._currentRound,
            playerPoints: Object.fromEntries(this._playerPoints),
            matchSchedule: this._tournamentSchedule,
            activeGames: this.getAllActiveGameStates().map(gs => ({
                matchId: gs.matchId!,
                player1Id: gs.player1Id,
                player2Id: gs.player2Id,
                score1: gs.score1,
                score2: gs.score2
            }))
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
                isReady: p._isReady,
                points: this._lobbyType === 'tournament' ? this._playerPoints.get(p.userId) || 0 : undefined;
            }));
    }

    /* GAME LOGIC FROM HERE */

    public async startGame() {
         if (this._gameStarted || this._lobbyType === 'tournament') {
            console.warn("Game already started or is a tournament lobby.");
            return;
        }
        this._gameStarted = true;
        if (this._games.size === 0) {
            console.error("No PongGame instance found for regular game.");
            this.stopGame();
            return;
        }

        const game = this._games.values().next().value;
        const matchId = this._games.keys().next().value;

        game!.resetScores();
        game!.resetGame();

        game!.startGameLoop()

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

    public get game(): PongGame {
        return this._game;
    }
}
