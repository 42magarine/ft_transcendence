import { WebSocket } from "ws";
import { LobbyInfo, ServerMessage } from "../../interfaces/interfaces.js";
import { MatchService } from "../services/MatchService.js";
import { Player } from "../gamelogic/components/Player.js";
import { IGameState } from "../../interfaces/interfaces.js";
import { PongGame } from "../gamelogic/Pong.js";
import { MatchModel } from "../models/MatchModel.js";

export class MatchLobby {
    protected _game: PongGame; // game components + logic
    protected _gameId!: number // this is the MatchModelId
    protected _saveScoreInterval: NodeJS.Timeout | null = null;
    protected _dbGame!: MatchModel //this is the MatchModel -> could just grab _dbGame.matchId instead of gameId??
    protected lobbyId: string; //lobbyId linked to matchModel -> could just gab _dbGame.lobbyId instead
    protected _players: Map<number, Player>; //list of active players in lobby ->currently only supports 2
    protected _broadcast: (lobbyId: string, data: ServerMessage) => void;
    protected _maxPlayers: number; //currently set to 2
    protected _gameStarted: boolean = false; // ...
    protected _lobbyName: string; // manually set in lobby or ignore this and delete!
    protected _isPublic: boolean; // public by default -> set manually or ignore and delete
    protected _createdAt: Date; // set automatically
    protected _lobbyType: 'game' | 'tournament' // currently only supports game
    protected _password?: string // currently never set -> either set in lobby or ignore and delete (check subject)
    protected _readyPlayers: Set<number> = new Set(); //update for players that pressed ready -> not implemented yet
    protected _creatorId!: number; // set to player1 user Id by default -> get from _dbGame.creatorId instead!!!
    protected _matchService: MatchService; //handed over from matchController in createLobby!
    ///// MOST OF THESE VARIABLES NEED TO BE GETTED FROM THE MATCH MODEL over matchService

    constructor(lobbyId: string,
        broadcast: (lobbyId: string, data: ServerMessage) => void,
        matchService: MatchService,
        options?: {
            name?: string,
            maxPlayers?: number,
            isPublic?: boolean,
            password?: string,
            lobbyType?: 'game' | 'tournament'
        }) {
        this.lobbyId = lobbyId;
        this._broadcast = broadcast;
        this._matchService = matchService!;
        this._players = new Map<number, Player>();
        this._maxPlayers = options?.maxPlayers || 2;
        this._isPublic = options?.isPublic || true;
        this._password = options?.password
        this._lobbyName = options?.name || `Lobby ${(lobbyId || '000000').substring(0, 6)}`;
        this._createdAt = new Date();
        this._lobbyType = options?.lobbyType || 'game';
        this._game = new PongGame(matchService);
    }

    //on player added set player number for added player -> needs to change for tournament later / do another one
    protected onPlayerAdded(player: Player): void {
        if (player._playerNumber <= 2) {
            this._game.setPlayer(player._playerNumber as 1 | 2, player);
        }
        this.updateLobbyParticipants();
    }

    // on player removed pause game! -> also need to update users and stuff maybe!!
    protected onPlayerRemoved(player: Player): void {
        if (this._game.isRunning && !this._game.isPaused) {
            this._game.pauseGame();
        }
    }

    //update lobby participants more for tournament
    private async updateLobbyParticipants() {
        if (this._dbGame && this._gameId) {
            for (const player of this._players.values()) {
                if (player.userId) {
                    await this._matchService!.addLobbyParticipant(this._gameId, player.userId)
                }
            }
        }
    }

    public getGameState(): IGameState {
        return this._game.getState();
    }

    public getGameId(): number | null {
        return this._gameId;
    }

    // at this point player 1 is already represented in the matchModel but not yet in the map of the LobbyObject
    public addPlayer(
        connection: WebSocket,
        userId: number) {
        //at this point is allways 0 and 2 so should work!
        if (this._players.size >= this._maxPlayers || this._gameStarted) {
            return null;
        }

        const playerNum = this._players.size + 1;
        const player = new Player(connection, playerNum, userId!);

        //set into player map of lobby object and set to an internal player number
        this._players.set(playerNum, player);

        if (playerNum === 1 && userId) {
            this._creatorId = userId;
        }

        this.onPlayerAdded(player);

        //broadcast a message to all users in lobby with info:
        // playerNumber, playerCount of lobby, and playerInfo -> only relevant for 2nd player and onwards
        this._broadcast(this.lobbyId, {
            type: "playerJoined",
            playerCount: this._players.size,
            playerInfo: {
                playerNumber: playerNum,
                userId: player.userId,
                isReady: player._isReady
            }
        })

        const playerList = this.getPlayerList();

        //send another message to frontend with lobbyInfo
        connection.send(JSON.stringify({
            type: "lobbyInfo",
            id: this.lobbyId,
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

        this._broadcast(this.lobbyId, {
            type: "playerDisconnected",
            id: player.id,
            playerCount: this._players.size
        });

        if (this._creatorId === player.userId && this._players.size > 0) {
            const nextPlayer = this._players.values().next().value;

            if (nextPlayer && nextPlayer.userId) {
                this._creatorId = nextPlayer.userId;
                this._broadcast(this.lobbyId, {
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

        this._broadcast(this.lobbyId, {
            type: "playerReady",
            playerNumber: playerId,
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
            this._broadcast(this.lobbyId, {
                type: "allPlayersReady"
            })
        }
        return allReady;
    }

    // (>0_0)> really? <(0_0<)
    public isFull(): boolean {
        return this._players.size >= this._maxPlayers;
    }

    // a_a
    public isEmpty(): boolean {
        return this._players.size === 0;
    }

    // lol
    public getPlayerCount(): number {
        return this._players.size;
    }

    // z.z
    public getCreatorId(): number | null {
        return this._creatorId;
    }

    // ...
    public isGameStarted(): boolean {
        return this._gameStarted;
    }

    // <.<
    public getPlayerById(id: number): Player | undefined {
        return this._players.get(id);
    }

    //return lobby id... cmon
    public getLobbyId(): string {
        return this.lobbyId;
    }

    //i mean cmon
    public getLobbyInfo(): LobbyInfo {
        return {
            id: this.lobbyId,
            name: this._lobbyName,
            creatorId: this._creatorId!,
            maxPlayers: this._maxPlayers,
            currentPlayers: this._players.size,
            createdAt: this._createdAt,
            lobbyType: this._lobbyType,
            isStarted: this._gameStarted
        };
    }

    //get list of players for lobbyview or smthing idk??
    public getPlayerList() {
        return Array.from(this._players.values()).map(p => ({
            playerNumber: p._playerNumber,
            userId: p.userId,
            isReady: p._isReady
        }));
    }

    //bool if password is correct(maybe delete if we dont pw protect our lobbies!)
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

    /* GAME LOGIC FROM HERE */

    //START GAME
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
            this._broadcast(this.lobbyId, data)
        })

        this._broadcast(this.lobbyId, {
            type: "gameStarted"
        })

        if (this._matchService) {
            const player1 = this._players.get(1);
            const player2 = this._players.get(2);

            if (player1?.userId && player2?.userId) {
                if (this._dbGame) {
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

    //save current score (should only be used for paused game stuff and so on)
    private async saveCurrentScore() {
        if (!this._gameId || !this._matchService) {
            return;
        }

        const state = this._game.getState();
        await this._matchService.updateScore(this._gameId, state.score1, state.score2, 0)
    }

    //check for win and actually save winner in case of win!!
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

        this._broadcast(this.lobbyId, {
            type: "gameOver",
            winnerId: winningPlayerId,
            winningUserId: winningPlayer.userId,
            player1Score,
            player2Score
        })
    }

    //resume game... duh
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

            this._broadcast(this.lobbyId, {
                type: "gameResumed"
            })
        }
    }

    // are you stupid?
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

        this._broadcast(this.lobbyId, {
            type: "gamePaused"
        })
    }

    // no srsly, who reads this???
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

        this._broadcast(this.lobbyId, {
            type: "gameStopped"
        })
    }
}
// https://meta.intra.42.fr/
