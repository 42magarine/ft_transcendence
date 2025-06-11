import { WebSocket } from "ws";
import { ILobbyState, IPlayerState, IServerMessage, ITournamentMatchPairing, ITournamentRound } from "../../interfaces/interfaces.js";
import { MatchService } from "../services/MatchService.js";
import { Player } from "../gamelogic/components/Player.js";
import { IGameState } from "../../interfaces/interfaces.js";
import { PongGame } from "../gamelogic/Pong.js";
import Pong from "../../frontend/views/Pong.js";
import { UserModel } from "../models/MatchModel.js";

export class MatchLobby
{
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

    private _gameBroadcastInterval: NodeJS.Timeout | null = null;

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

    public getGameState(matchId: number): IGameState | undefined {
        const game = this._games.get(matchId)
        return game ? game.getState() : undefined;
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

            this._players.delete(player._playerNumber);
            this._readyPlayers.delete(player.userId); // Use userId for readyPlayers set

            // If it's a tournament, cancel the entire tournament
            if (this._lobbyType === 'tournament') {
                console.log(`Player ${player._name} left tournament lobby ${this._lobbyId}. Cancelling tournament.`);
                await this.cancelTournament("A player left the tournament.");
            } else {

                await this._matchService.removePlayerFromMatch(this._lobbyId, player.userId);


                for (const [matchId, game] of this._games.entries()) {
                    if (game._player1?._userId === player.userId || game._player2?._userId === player.userId) {
                        game.stopGameLoop();
                        this._games.delete(matchId);

                        await this._matchService.updateMatchStatus(matchId, 'cancelled');
                    }
                }
            }

            this.repositionPlayers();

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
                points: this._lobbyType === 'tournament' ? this._playerPoints.get(p.userId) || 0 : undefined
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

        const player1 = this._players.get(1);
        const player2 = this._players.get(2);
        if (player1 && player2) {
            game!.setPlayer(1, player1);
            game!.setPlayer(2, player2);
            game!.setMatchId(matchId!);
        } else {
            console.error("Cannot start game: missing players.");
            this.stopGame();
            return;
        }

        const initialGameState = game!.getState();

        if (player1?.connection.readyState === WebSocket.OPEN) {
            player1.connection.send(JSON.stringify({
                type: "playerJoined",
                matchId: matchId,
                gameState: initialGameState
            }));
            console.log(`[Backend] Sent playerJoined to Player 1 (User ID: ${player1.userId}) for match ${matchId}`);
        }

        if (player2?.connection.readyState === WebSocket.OPEN) {
            player2.connection.send(JSON.stringify({
                type: "playerJoined",
                matchId: matchId,
                gameState: initialGameState
            }));
            console.log(`[Backend] Sent playerJoined to Player 2 (User ID: ${player2.userId}) for match ${matchId}`);
        }

        game!.startGameLoop();

        if (this._matchService && matchId) {
            await this._matchService.updateMatchStatus(matchId, 'ongoing', new Date());
        }

        this.startPeriodicGameBroadcast();

        this._broadcast({
            type: "gameStarted",
            lobby: this.getLobbyState(),
            gameState: game!.getState(),
            matchId: matchId
        });
    }

    // this._dbGame nicht direkt aufrufen, sondern über funktionen aus MatchService.ts

    public getAllActiveGameStates(): IGameState[] {
        return Array.from(this._games.values()).map(game => game.getState());
    }

    private startPeriodicGameBroadcast()
    {
        if (this._gameBroadcastInterval) {
            clearInterval(this._gameBroadcastInterval);
        }
        this._gameBroadcastInterval = setInterval(() => {
            if (this._games.size > 0) {
                this._broadcast({
                    type: "gameStateUpdate",
                    activeGamesStates: this.getAllActiveGameStates(),
                    lobby: this.getLobbyState()
                });
            }
            this.saveCurrentScores();
        }, 1000 / 30);
    }

    private stopPeriodicGameBroadcast() {
        if (this._gameBroadcastInterval) {
            clearInterval(this._gameBroadcastInterval);
            this._gameBroadcastInterval = null;
        }
    }

    //ersetzt durch savecurrentscores!!
    // //save current score (should only be used for paused game stuff and so on)
    // private async saveCurrentScore() {
    //     if (!this._gameId || !this._matchService) {
    //         return;
    //     }

    //     const state = this._games.getState();
    //     await this._matchService.updateScore(this._gameId, state.score1, state.score2, 0)
    // }

    public async startTournament() {
        if (this._tournamentStatus === 'ongoing' || this._gameStarted || this._lobbyType !== 'tournament') {
            console.warn("Tournament already started, game active, or not a tournament lobby.");
            return;
        }
        if (this._players.size < 4) {
            console.error("Not enough players to start tournament (min 4).");
            return;
        }
        if (this._readyPlayers.size !== this._players.size) {
            console.error("Not all players are ready for the tournament.");
            return;
        }

        this._tournamentStatus = 'ongoing';
        this._gameStarted = true;

        if (this._tournamentId) {
            await this._matchService.updateTournamentStatus(this._tournamentId, 'ongoing', new Date());
        }

        this._tournamentSchedule = this.generateRoundRobinSchedule();

        Array.from(this._players.values()).forEach(p => {
            if (!this._playerPoints.has(p.userId)) {
                this._playerPoints.set(p.userId, 0);
            }
        });

        this._currentRound = 0;

        this._broadcast({
            type: "tournamentStarted",
            lobby: this.getLobbyState(),
            message: "Tournament has begun! Generating matches..."
        });

        await this.startNextTournamentRound();
    }

    private generateRoundRobinSchedule(): ITournamentRound[] {
        const playersArray = Array.from(this._players.values()).map(p => p.userId);
        const n = playersArray.length;
        const schedule: ITournamentRound[] = [];

        if (n < 2) return [];

        let participants = [...playersArray];
        let hasBye = false;

        if (n % 2 !== 0) {
            participants.push(0);
            hasBye = true;
        }

        const numRounds = hasBye ? n : n - 1;
        const numMatchesPerRound = (n + (hasBye ? 1 : 0)) / 2;

        for (let round = 0; round < numRounds; round++) {
            const currentRoundMatches: ITournamentMatchPairing[] = [];
            for (let i = 0; i < numMatchesPerRound; i++) {
                const player1Id = participants[i];
                const player2Id = participants[participants.length - 1 - i];

                if (player1Id !== 0 && player2Id !== 0) {
                    currentRoundMatches.push({ player1Id, player2Id, matchId: null, isCompleted: false });
                }
            }
            schedule.push({ roundNumber: round + 1, matches: currentRoundMatches });

            if (participants.length > 1) {
                const pivot = participants[0];
                const movingPlayers = participants.slice(1);
                const lastMovingPlayer = movingPlayers.pop();
                if (lastMovingPlayer !== undefined) {
                    movingPlayers.unshift(lastMovingPlayer);
                }
                participants = [pivot, ...movingPlayers];
            }
        }
        console.log("Generated Tournament Schedule:", schedule);
        return schedule;
    }


    private async startNextTournamentRound() {
        this._currentRound++;
        this._games.clear();

        if (this._currentRound > this._tournamentSchedule.length) {
            console.log("All rounds completed! Tournament Finished.");
            await this.finishTournament();
            return;
        }

        const currentRoundSchedule = this._tournamentSchedule[this._currentRound - 1];
        if (!currentRoundSchedule || currentRoundSchedule.matches.length === 0) {
            console.log(`No matches for Round ${this._currentRound}. Moving to next round.`);
            await this.startNextTournamentRound();
            return;
        }

        console.log(`Starting Round ${this._currentRound} with ${currentRoundSchedule.matches.length} matches.`);
        this._broadcast({
            type: "tournamentRoundStart",
            lobby: this.getLobbyState(),
            message: `Round ${this._currentRound} is starting! Matches: ${currentRoundSchedule.matches.length}`
        });

        for (const matchPairing of currentRoundSchedule.matches) {
            if (!matchPairing.isCompleted) {
                await this.startSpecificTournamentMatch(matchPairing);
            }
        }
        this.startPeriodicGameBroadcast();
    }

    private async startSpecificTournamentMatch(matchPairing: ITournamentMatchPairing) {
        const player1UserId = matchPairing.player1Id;
        const player2UserId = matchPairing.player2Id;

        const player1 = Array.from(this._players.values()).find(p => p.userId === player1UserId);
        const player2 = Array.from(this._players.values()).find(p => p.userId === player2UserId);

        if (!player1 || !player2) {
            console.error(`Missing players for match: P1:${player1UserId}, P2:${player2UserId}. Skipping match.`);
            matchPairing.isCompleted = true;
            return;
        }

        const newMatch = await this._matchService.createTournamentMatch(
            this._lobbyId,
            player1UserId,
            player2UserId,
            this._tournamentId!
        );

        matchPairing.matchId = newMatch.matchModelId;
        await this._matchService.updateTournamentSchedule(this._tournamentId!, this._tournamentSchedule);

        const game = new PongGame(this.handleGameEndCallback.bind(this, newMatch.matchModelId));
        game.setMatchId(newMatch.matchModelId);
        this._games.set(newMatch.matchModelId, game);

        game.resetScores();
        game.resetGame();
        game.setPlayer(1, player1);
        game.setPlayer(2, player2);
        game.startGameLoop();

        await this._matchService.updateMatchStatus(newMatch.matchModelId, 'ongoing', new Date());

        console.log(`Starting ze match wiz the ${newMatch.matchModelId}: ${player1._name} vs ${player2._name}`);
        this._broadcast({
            type: "tournamentMatchStart",
            lobby: this.getLobbyState(),
            gameState: game.getState(),
            player1Name: player1._name,
            player2Name: player2._name,
            matchId: newMatch.matchModelId
        });
    }

    private async handleGameEndCallback(matchId: number) {
        const game = this._games.get(matchId);
        if (!game) {
            console.error("Game not found.");
            return;
        }
        console.log("Game end");
        await this.handleGameEnd(matchId, game._score1, game._score2);
    }

    private async handleGameEnd(matchId: number, player1Score: number, player2Score: number) {
        const game = this._games.get(matchId);
        if (!game) return;

        game.stopGameLoop();
        this._games.delete(matchId);

        let winnerId: number | null = null;
        let winningPlayer: Player | undefined;
        let losingPlayer: Player | undefined;

        if (player1Score > player2Score) {
            winningPlayer = game._player1!;
            losingPlayer = game._player2!;
            winnerId = winningPlayer?.userId || null;
        } else if (player2Score > player1Score) {
            winningPlayer = game._player2!;
            losingPlayer = game._player1!;
            winnerId = winningPlayer?.userId || null;
        }

        await this._matchService.updateScore(
            matchId,
            player1Score,
            player2Score,
            winnerId || 0
        );

        const dbMatch = await this._matchService.getMatchById(matchId);
        if (dbMatch) {
            dbMatch.status = 'completed';
            dbMatch.endedAt = new Date();
            const winner = winnerId ? await this._matchService.userService.findUserById(winnerId) : undefined;
            dbMatch.winner = winner ?? undefined; //This is the reason I hate typescript. It's so fkin stupid
            await this._matchService.matchRepo.save(dbMatch);
        }

        if (this._lobbyType === 'tournament') {
            const player1UserId = game._player1?._userId;
            const player2UserId = game._player2?._userId;

            if (player1UserId && player2UserId) {
                let p1Points = this._playerPoints.get(player1UserId) || 0;
                let p2Points = this._playerPoints.get(player2UserId) || 0;

                if (player1Score > player2Score) {
                    p1Points += 3;
                    p2Points += 0;
                } else if (player2Score > player1Score) {
                    p2Points += 3;
                    p1Points += 0;
                } else {
                    p1Points += 1;
                    p2Points += 1;
                }
                this._playerPoints.set(player1UserId, p1Points);
                this._playerPoints.set(player2UserId, p2Points);

                let matchFoundInSchedule = false;
                for (const round of this._tournamentSchedule) {
                    for (const pairing of round.matches) {
                        if (pairing.matchId === matchId) {
                            pairing.isCompleted = true;
                            matchFoundInSchedule = true;
                            break;
                        }
                    }
                    if (matchFoundInSchedule) break;
                }

                if (this._tournamentId) {
                    await this._matchService.updateTournamentSchedule(this._tournamentId, this._tournamentSchedule);
                    await this._matchService.updateTournamentPlayerPoints(this._tournamentId, Object.fromEntries(this._playerPoints));
                }
            }

            this._broadcast({
                type: "tournamentMatchOver",
                matchId: matchId,
                winnerId: winnerId,
                player1Score,
                player2Score,
                lobby: this.getLobbyState(),
                message: winnerId ? `${winningPlayer?._name} won the match!` : "It's a tie!"
            });

            const currentRoundSchedule = this._tournamentSchedule[this._currentRound - 1];
            const allMatchesInRoundCompleted = currentRoundSchedule.matches.every(m => m.isCompleted);

            if (allMatchesInRoundCompleted) {
                console.log(`All matches in Round ${this._currentRound} completed.`);
                if (this._games.size === 0) {
                     setTimeout(() => {
                        this.stopPeriodicGameBroadcast();
                        this.startNextTournamentRound();
                    }, 3000);
                }
            } else {
                 console.log(`Round ${this._currentRound} still has active matches. Remaining: ${currentRoundSchedule.matches.filter(m => !m.isCompleted).length}`);
            }

        } else {
            this._broadcast({
                type: "gameOver",
                winnerId: winnerId,
                winningUserId: winnerId,
                player1Score,
                player2Score,
                lobby: this.getLobbyState()
            });
            this.stopGame();
        }
    }

    private async saveCurrentScores() {
        for (const [matchId, game] of this._games.entries()) {
            const state = game.getState();
            await this._matchService.updateScore(matchId, state.score1, state.score2, 0);
        }
    }

    private async finishTournament() {
        this._tournamentStatus = 'completed';
        this._gameStarted = false;
        this._currentRound = 0;
        this.stopPeriodicGameBroadcast();
        this._games.clear();

        let tournamentWinner: UserModel | null = null;
        let maxPoints = -1;
        let winnerUserIds: number[] = [];

        for (const [userId, points] of this._playerPoints.entries()) {
            if (points > maxPoints) {
                maxPoints = points;
                winnerUserIds = [userId];
            } else if (points === maxPoints) {
                winnerUserIds.push(userId);
            }
        }

        if (winnerUserIds.length === 1) {
            tournamentWinner = await this._matchService.userService.findUserById(winnerUserIds[0]);
        }

        if (this._tournamentId) {
            await this._matchService.updateTournamentCompletion(this._tournamentId, tournamentWinner?.id, new Date());
        }

        this._broadcast({
            type: "tournamentFinished",
            lobby: this.getLobbyState(),
            winnerId: tournamentWinner?.id || null,
            winnerUserName: tournamentWinner?.username || null,
            message: tournamentWinner ? `${tournamentWinner.username} wins the tournament!` : "The tournament ended in a tie!"
        });
    }

    public async cancelTournament(reason: string = "Tournament cancelled.") {
        console.log(`Tournament ${this._lobbyId} is being cancelled. Reason: ${reason}`);

        this._games.forEach(game => game.stopGameLoop());
        this._games.clear();
        this.stopPeriodicGameBroadcast();

        this._tournamentStatus = 'cancelled';
        this._gameStarted = false;

        if (this._tournamentId) {
            await this._matchService.updateTournamentStatus(this._tournamentId, 'cancelled', new Date());
            await this._matchService.deleteAllMatchesForTournament(this._tournamentId);
        }

        this._currentRound = 0;
        this._tournamentSchedule = [];
        this._playerPoints.clear();
        this._readyPlayers.clear();

        this._broadcast({
            type: "tournamentCancelled",
            lobby: this.getLobbyState(),
            message: reason
        });
    }

    public async stopGame() {
        if (!this._gameStarted && this._lobbyType === 'game') {
            return;
        }

        this._gameStarted = false;
        this.stopPeriodicGameBroadcast();

        this._games.forEach(game => game.stopGameLoop());
        this._games.clear();

        if (this._lobbyType === 'game' && this.getGameId() && this._matchService) {
            const matchId = this.getGameId();
            this._matchService.getMatchById(matchId!).then(game => {
                if (game && game.status !== 'completed') {
                    game.status = 'cancelled';
                    game.endedAt = new Date();
                    this._matchService.matchRepo.save(game);
                }
            });
        }
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
    }

    // public getGame(): PongGame {
    //     return this._games.;
    // }
}
