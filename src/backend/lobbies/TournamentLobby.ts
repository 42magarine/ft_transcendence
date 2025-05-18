// import { match } from "assert";
// import { LobbyInfo, ServerMessage } from "../../interfaces/interfaces.js";
// import { Player } from "../gamelogic/components/Player.js";
// import { TournamentService } from "../services/TournamentService.js";
// import { GameLobby } from "./GameLobby.js";
// import { MatchLobby } from "./MatchLobby.js";
// import { randomUUID } from "crypto";
// import { GameService } from "../services/GameService.js";
// import { PongGame } from "../gamelogic/Pong.js";

// export class TournamentLobby extends MatchLobby {
//     private _pongGame: PongGame;
//     private _tournamentService: TournamentService;
//     private _gameService: GameService;
//     private _tournamentId: number | null = null;
//     private _currentMatchIndex: number = 0;
//     private _matches: Array<{
//         player1Id: number,
//         player2Id: number,
//         matchId: number | null,
//         gameLobbyId: string | null,
//         status: 'pending' | 'ongoing' | 'completed'
//     }> = [];
//     private _playerPoints: Map<number, number> = new Map();
//     private _gameLobbies: Map<string, GameLobby> = new Map();

//     constructor(
//         id: string,
//         broadcast: (lobbyId: string, data: ServerMessage) => void,
//         tournamentService: TournamentService,
//         pongGame: PongGame,
//         gameService: GameService,
//         options?: {
//             name?: string,
//             maxPlayers?: number,
//             isPublic?: boolean,
//             password?: string
//         }
//     ) {
//         super(id, broadcast, tournamentService, {
//             ...options,
//             maxPlayers: options?.maxPlayers || 4,
//             lobbyType: 'tournament'
//         });
//         this._pongGame = pongGame;
//         this._tournamentService = tournamentService;
//         this._gameService = gameService;
//     }

//     protected onPlayerAdded(player: Player): void {
//         if (player.userId && !this._playerPoints.has(player.userId)) {
//             this._playerPoints.set(player.userId, 0);
//         }

//         this.updateTournamentInfo();
//     }

//     protected onPlayerRemoved(player: Player): void {
//         if (this._gameStarted && player.userId) {
//             this._matches.forEach(match => {
//                 if (match.status === 'ongoing' &&
//                     (match.player1Id === player.userId || match.player2Id === player.userId)) {
//                     match.status = 'completed';

//                     const opponentId = match.player1Id === player.userId ? match.player2Id : match.player1Id;
//                     this._playerPoints.set(opponentId, (this._playerPoints.get(opponentId) || 0) + 3);

//                     if (match.gameLobbyId) {
//                         const gameLobby = this._gameLobbies.get(match.gameLobbyId);
//                         if (gameLobby) {
//                             gameLobby.stopGame();
//                             this._gameLobbies.delete(match.gameLobbyId);
//                         }
//                     }
//                 }
//             });

//             this.checkAndProgressTournament();
//         }

//         this.updateTournamentInfo();
//     }

//     private updateTournamentInfo(): void {
//         const playerList = this.getPlayerList();
//         const standings = Array.from(this._playerPoints.entries())
//             .map(([userId, points]) => {
//                 const player = playerList.find(p => p.userId === userId);
//                 return {
//                     userId,
//                     playerId: player?.id,
//                     points
//                 };
//             })
//             .sort((a, b) => b.points - a.points);

//         this._broadcast(this._id, {
//             type: "tournamentInfo",
//             id: this._id,
//             tournamentId: this._tournamentId,
//             name: this._lobbyName,
//             players: playerList,
//             creatorId: this._creatorId,
//             maxPlayers: this._maxPlayers,
//             isStarted: this._gameStarted,
//             matches: this._matches,
//             currentMatchIndex: this._currentMatchIndex,
//             standings
//         });
//     }

//     public async startGame(): Promise<void> {
//         if (this._players.size < 2 || this._gameStarted) {
//             return;
//         }

//         this._gameStarted = true;

//         if (!this._tournamentId && this._creatorId) {
//             try {
//                 const tournament = await this._tournamentService.createTournament(
//                     this._lobbyName,
//                     this._creatorId,
//                     this._maxPlayers
//                 );

//                 this._tournamentId = tournament.id;

//                 for (const player of this._players.values()) {
//                     if (player.userId) {
//                         await this._tournamentService.addParticipant(this._tournamentId, player.userId);
//                     }
//                 }

//                 const startedTournament = await this._tournamentService.startTournament(this._tournamentId);

//                 this._matches = startedTournament.matches.map(match => ({
//                     player1Id: match.player1.id,
//                     player2Id: match.player2.id,
//                     matchId: match.id,
//                     gameLobbyId: null,
//                     status: 'pending'
//                 }));

//                 for (const player of this._players.values()) {
//                     if (player.userId) {
//                         this._playerPoints.set(player.userId, 0);
//                     }
//                 }

//                 this._broadcast(this._id, {
//                     type: "tournamentStarted",
//                     tournamentId: this._tournamentId,
//                     matches: this._matches
//                 });

//                 this.startNextMatch();
//             } catch (error) {
//                 console.error("Failed to start tournament:", error);
//                 this._gameStarted = false;
//                 this._broadcast(this._id, {
//                     type: "error",
//                     message: "Failed to start tournament"
//                 });
//             }
//         }
//     }

//     private async startNextMatch(): Promise<void> {
//         if (this._currentMatchIndex >= this._matches.length) {
//             await this.finishTournament();
//             return;
//         }

//         const currentMatch = this._matches[this._currentMatchIndex];
//         if (currentMatch.status !== 'pending') {
//             this._currentMatchIndex++;
//             this.startNextMatch();
//             return;
//         }

//         const gameLobbyId = randomUUID();
//         const gameLobby = new GameLobby(
//             gameLobbyId,
//             this._broadcast,
//             this._gameService
//         );

//         this._gameLobbies.set(gameLobbyId, gameLobby);
//         currentMatch.gameLobbyId = gameLobbyId;
//         currentMatch.status = 'ongoing';

//         const player1 = Array.from(this._players.values()).find(p => p.userId === currentMatch.player1Id);
//         const player2 = Array.from(this._players.values()).find(p => p.userId === currentMatch.player2Id);

//         if (!player1 || !player2) {
//             currentMatch.status = 'completed';
//             this._currentMatchIndex++;
//             this.startNextMatch();
//             return;
//         }

//         // gameLobby.onGameCompleted = async (winnerId, player1Score, player2Score) => {
//         //     await this.handleMatchCompleted(currentMatch, winnerId, player1Score, player2Score);
//         // };

//         // if (player1.connection && player2.connection) {
//         //     gameLobby.addPlayer(player1.connection, player1.userId);
//         //     gameLobby.addPlayer(player2.connection, player2.userId);

//         //     gameLobby.setPlayerReady(1, true);
//         //     gameLobby.setPlayerReady(2, true);

//         //     setTimeout(() => {
//         //         gameLobby.startGame();
//         //     }, 3000);

//         //     this._broadcast(this._id, {
//         //         type: "matchStarted",
//         //         matchIndex: this._currentMatchIndex,
//         //         player1Id: currentMatch.player1Id,
//         //         player2Id: currentMatch.player2Id,
//         //         gameLobbyId
//         //     });

//         //     this.updateTournamentInfo();
//         // } else {
//         //     currentMatch.status = 'completed';
//         //     this._currentMatchIndex++;
//         //     this.startNextMatch();
//         // }
//     }

//     private async handleMatchCompleted(
//         match: {
//             player1Id: number,
//             player2Id: number,
//             matchId: number | null,
//             gameLobbyId: string | null,
//             status: 'pending' | 'ongoing' | 'completed'
//         },
//         winnerId: number | null,
//         player1Score: number,
//         player2Score: number
//     ): Promise<void> {
//         match.status = 'completed';

//         if (match.matchId) {
//             try {
//                 await this._tournamentService.updateMatchScore(match.matchId, player1Score, player2Score);
//             } catch (error) {
//                 console.error("Failed to update match score:", error);
//             }
//         }

//         if (player1Score > player2Score) {
//             this._playerPoints.set(match.player1Id, (this._playerPoints.get(match.player1Id) || 0) + 3);
//         } else if (player1Score < player2Score) {
//             this._playerPoints.set(match.player2Id, (this._playerPoints.get(match.player2Id) || 0) + 3);
//         } else {
//             this._playerPoints.set(match.player1Id, (this._playerPoints.get(match.player1Id) || 0) + 1);
//             this._playerPoints.set(match.player2Id, (this._playerPoints.get(match.player2Id) || 0) + 1);
//         }

//         if (match.gameLobbyId && this._gameLobbies.has(match.gameLobbyId)) {
//             const gameLobby = this._gameLobbies.get(match.gameLobbyId);
//             if (gameLobby) {
//                 gameLobby.stopGame();
//                 this._gameLobbies.delete(match.gameLobbyId);
//             }
//         }

//         this._broadcast(this._id, {
//             type: "matchCompleted",
//             matchIndex: this._currentMatchIndex,
//             player1Id: match.player1Id,
//             player2Id: match.player2Id,
//             player1Score,
//             player2Score,
//             winnerId
//         });

//         this.updateTournamentInfo();

//         this._currentMatchIndex++;
//         setTimeout(() => {
//             this.checkAndProgressTournament();
//         }, 5000);
//     }

//     private checkAndProgressTournament(): void {
//         const allMatchesCompleted = this._matches.every(match => match.status === 'completed');

//         if (allMatchesCompleted) {
//             this.finishTournament();
//         } else if (this._currentMatchIndex < this._matches.length) {
//             this.startNextMatch();
//         }
//     }

//     private async finishTournament(): Promise<void> {
//         if (!this._tournamentId) return;

//         const standings = Array.from(this._playerPoints.entries())
//             .sort((a, b) => b[1] - a[1]);

//         const winner = standings.length > 0 ? standings[0][0] : null;

//         this._broadcast(this._id, {
//             type: "tournamentCompleted",
//             tournamentId: this._tournamentId,
//             standings: standings.map(([userId, points]) => ({ userId, points })),
//             winnerId: winner
//         });

//         this._gameStarted = false;
//     }

//     public stopGame(): void {
//         if (!this._gameStarted)
//         {
//             return;
//         }

//         for (const [id, lobby] of this._gameLobbies.entries())
//         {
//             lobby.stopGame();
//         }

//         this._gameLobbies.clear();
//         this._gameStarted = false;

//         this._broadcast(this._id, {
//             type: "tournamentStopped"
//         });
//     }
// }
