import { FastifyReply, FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import { randomUUID } from "crypto";
import { IClientMessage, IServerMessage, IPaddleDirection, IPlayerState, ITournamentRound, ILobbyState } from "../../interfaces/interfaces.js";
import { Player } from "../gamelogic/components/Player.js";
import { MatchLobby } from "../lobbies/MatchLobby.js";
import { MatchService } from "../services/MatchService.js";
import { MatchModel, TournamentModel } from "../models/MatchModel.js";

export class MatchController {
    private _matchService: MatchService;
    private _lobbies: Map<string, MatchLobby>;
    private _clients: Map<WebSocket, Player | null>;

    constructor(matchService: MatchService) {
        this._matchService = matchService;
        this._lobbies = new Map();
        this._clients = new Map();
        this.initializeController();
    }

    private async initializeController() {
        await this._matchService.cleanupCrashed();
        await this.initOpenLobbies();
    }

    private async initOpenLobbies() {
        const openDbLobbies = await this._matchService.getOpenLobbies();

        for (const lobbyData of openDbLobbies) {
            let lobby: MatchLobby;
            const isTournament = (lobbyData as TournamentModel).creator !== undefined;

            if (isTournament) {
                const tournamentData = lobbyData as TournamentModel;
                lobby = new MatchLobby(
                    tournamentData.lobbyId,
                    this._matchService,
                    this.broadcastToLobby.bind(this, tournamentData.lobbyId),
                    {
                        name: tournamentData.name,
                        maxPlayers: tournamentData.maxPlayers,
                        lobbyType: 'tournament',
                        tournamentId: tournamentData.id,
                        tournamentStatus: tournamentData.status,
                        currentRound: tournamentData.currentRound,
                        playerPoints: tournamentData.playerScores,
                        matchSchedule: tournamentData.matchSchedule as ITournamentRound[]
                    }
                );
            }
            else {
                const matchData = lobbyData as MatchModel;
                lobby = new MatchLobby(
                    matchData.lobbyId,
                    this._matchService,
                    this.broadcastToLobby.bind(this, matchData.lobbyId),
                    {
                        name: matchData.lobbyName,
                        maxPlayers: matchData.maxPlayers,
                        lobbyType: 'game'
                    }
                );
                if (matchData.player1) {
                    const player = new Player(null!, 1, matchData.player1.id, lobby.getLobbyId(), matchData.player1.username);
                    lobby.addPlayer(null!, player.userId);
                }
            }
            this._lobbies.set(lobbyData.lobbyId, lobby);
        }
    }

    public handleConnection(connection: WebSocket, request: FastifyRequest) {
        this._clients.set(connection, null);

        connection.on("message", (message: string | Buffer) => {
            this.handleMessage(message, connection);
        });

        connection.on("close", () => {
            this.handleCloseSocket(connection, request);
        });

        // Set online status
        this._matchService.userService.setUserOnline(request.user!.id, true);
        this.broadcastToAll({ type: "updateFriendlist" });

        this.sendMessage(connection, {
            type: "connection",
            message: "Connected to game server",
        });
    }

    private handleMessage(message: string | Buffer, connection: WebSocket) {
        let data: IClientMessage;
        try {
            data = JSON.parse(message.toString()) as IClientMessage;
        }
        catch (error: unknown) {
            console.error("Invalid message format", error)
            return;
        }

        const player = this._clients.get(connection);
        switch (data.type) {
            case "joinLobby":
                this.handleJoinLobby(connection, data.userId!, data.lobbyId!)
                break;
            case "createLobby":
                this.handleCreateLobby(connection, data.userId!, data.lobbyType, data.maxPlayers)
                break;
            case "leaveLobby":
                if (player) //todo fix in frontend leave route and button sends this twice
                    this.handleLeaveLobby(connection, data.lobbyId!, data.gameIsOver!)
                break;
            case "movePaddle":
                if (player && data.matchId !== undefined && data.direction !== undefined) {
                    this.handleMovePaddle(player, data.matchId, data.playerNumber!, data.direction);
                }
                else {
                    console.error("MatchController - handleMovePaddle(): Missing player, matchId, or direction.");
                }
                break;
            case "ready":
                this.handlePlayerReady(player!, data.ready!)
                break;
            case "startGame":
                this.handleStartGame(data.lobbyId!);
                break;
            case "getLobbyList":
                this.handleGetLobbyList(connection);
                break;
            case "getLobbyState":
                this.handleGetLobbyState(data.lobbyId!);
                break;
            default:
                this.sendMessage(connection, {
                    type: "error",
                    message: "not yet implemented"
                });
        }
    }

    private handleCloseSocket(connection: WebSocket, request: FastifyRequest) {
        const player = this._clients.get(connection);

        if (player && player.lobbyId) {
            const lobby = this._lobbies.get(player.lobbyId);

            // Check if any game is started in the lobby
            if (lobby && lobby.isGameStarted()) {
                this.handleLeaveLobby(connection, player.lobbyId, true)
            }
            else {
                this.handleLeaveLobby(connection, player.lobbyId, false)
            }
        }
        this._clients.delete(connection);

        // Set online status
        this._matchService.userService.setUserOnline(request.user!.id, false);
        this.broadcastToAll({ type: "updateFriendlist" });
    }

    private sendMessage(connection: WebSocket, data: IServerMessage) {
        if (connection.readyState === WebSocket.OPEN) {
            // console.log("sendMessage (backend->frontend): ", data)
            connection.send(JSON.stringify(data));
        }
    }

    private broadcastToAll(data: IServerMessage): void {
        for (const [connection, player] of this._clients.entries()) {
            // console.log(data);
            if (connection.readyState === WebSocket.OPEN) {
                this.sendMessage(connection, data);
            }
        }
    }

    private broadcastToLobby(lobbyId: string, data: IServerMessage): void {
        for (const [connection, player] of this._clients.entries()) {
            if (
                connection.readyState === WebSocket.OPEN &&
                player &&
                player._lobbyId === lobbyId
            ) {
                this.sendMessage(connection, data);
            }
        }
    }

    private async handleCreateLobby(connection: WebSocket, userId: number, lobbyType: 'game' | 'tournament' = 'game', maxPlayers?: number) {
        const lobbyId = randomUUID();
        const options = {
            lobbyType: lobbyType,
            maxPlayers: maxPlayers || (lobbyType === 'tournament' ? 8 : 2)
        };

        const lobby = new MatchLobby(
            lobbyId,
            this._matchService,
            this.broadcastToLobby.bind(this, lobbyId),
            options
        );

        this._lobbies.set(lobbyId, lobby);

        const player = await lobby.addPlayer(connection, userId);
        if (player) {
            this._clients.set(connection, player);

            this.broadcastToAll({
                type: "lobbyCreated",
                lobbyId: lobbyId,
                owner: userId,
                lobbyType: lobby._lobbyType,
                maxPlayers: lobby._maxPlayers
            });
            this.broadcastToLobby(lobbyId, {
                type: "lobbyState",
                lobby: lobby.getLobbyState()
            });
        }
        else {
            console.error("Failed to add player to new lobby.");
            this._lobbies.delete(lobbyId);
        }
    }

    private async handleJoinLobby(connection: WebSocket, userId: number, lobbyId: string) {
        if (!userId || !lobbyId) {
            console.error("Matchcontroller - handleJoinLobby(): UserId and LobbyId are required");
            return;
        }

        const lobby = this._lobbies.get(lobbyId);
        if (!lobby) {
            console.error("Matchcontroller - handleJoinLobby(): Couldn't find Lobby");
            return;
        }

        const player = await lobby.addPlayer(connection, userId);
        if (player) {
            this._clients.set(connection, player);
            this.broadcastToAll({
                type: "joinedLobby",
                lobbyId: lobbyId,
                owner: userId,
                lobbyType: lobby._lobbyType
            });
            this.broadcastToLobby(lobbyId, {
                type: "playerJoined",
                lobby: lobby.getLobbyState()
            });
        }
        else {
            console.error("Matchcontroller - handleJoinLobby(): Couldn't join Lobby");
        }
    }

    private async handleLeaveLobby(connection: WebSocket, lobbyId: string, gameIsOver: boolean) {
        const lobby = this._lobbies.get(lobbyId);
        if (!lobby) {
            console.error("Matchcontroller - handleLeaveLobby(): Couldn't find Lobby");
            return;
        }

        const player = this._clients.get(connection);
        if (!player) {
            console.error("Matchcontroller - handleLeaveLobby(): Player not found in this Lobby");
            return;
        }

        try {
            if (gameIsOver) {
                this.broadcastToLobby(lobbyId, {
                    type: "playerLeftGame"
                });
            }
            await lobby.removePlayer(player);

            if (lobby.isEmpty()) {
                this._lobbies.delete(lobbyId);
                if (lobby._lobbyType === 'game') {
                    await this._matchService.deleteMatchByLobbyId(lobbyId);

                }
            }
            else {
                if (this._lobbies.has(lobbyId)) {
                    this.broadcastToLobby(lobbyId, {
                        type: "playerLeft",
                        lobby: lobby.getLobbyState()
                    });
                }
            }

            this._clients.set(connection, null);
            this.broadcastToAll({
                type: "leftLobby",
                lobbyId: lobbyId,

            });
        }
        catch (error) {
            console.error("Matchcontroller - handleLeaveLobby(): Player failed to leave Lobby", error);
        }
    }

    private async handleGetLobbyState(lobbyId: string) {
        const lobby = this._lobbies.get(lobbyId);
        if (!lobby) {
            console.error("Matchcontroller - handleGetLobbyState(): Couldn't find Lobby");
            return;
        }

        this.broadcastToLobby(lobbyId, {
            type: "lobbyState",
            lobby: lobby.getLobbyState()
        });
    }

    private async handleGetLobbyList(connection: WebSocket) {
        // console.log("handleGetLobbyList")
        const openDbLobbies = await this._matchService.getOpenLobbies();

        const lobbyStates: ILobbyState[] = openDbLobbies.map(dbLobby => {
            const activeLobby = this._lobbies.get(dbLobby.lobbyId);

            if (activeLobby) {
                return activeLobby.getLobbyState();
            }

            const isTournament = (dbLobby as TournamentModel).creator !== undefined;
            return {
                lobbyId: dbLobby.lobbyId,
                name: (dbLobby as MatchModel).lobbyName || (dbLobby as TournamentModel).name || `Lobby ${dbLobby.lobbyId || dbLobby.status}`,
                creatorId: (dbLobby as MatchModel).player1?.id || (dbLobby as TournamentModel).creator?.id || 0,
                maxPlayers: dbLobby.maxPlayers,
                currentPlayers: dbLobby.lobbyParticipants?.length || 0,
                createdAt: dbLobby.createdAt,
                lobbyType: isTournament ? 'tournament' : 'game',
                isStarted: false,
                lobbyPlayers: dbLobby.lobbyParticipants ? dbLobby.lobbyParticipants.map(p => ({
                    playerNumber: 0,
                    userId: p.id,
                    userName: p.username,
                    isReady: false
                })) : [],
                tournamentStatus: isTournament ? (dbLobby as TournamentModel).status : undefined,
                currentRound: isTournament ? (dbLobby as TournamentModel).currentRound || 0 : undefined,
                playerPoints: isTournament ? (dbLobby as TournamentModel).playerScores || {} : undefined,
                matchSchedule: isTournament ? (dbLobby as TournamentModel).matchSchedule as ITournamentRound[] || [] : undefined,
                activeGames: []
            } as ILobbyState;
        });

        this.sendMessage(connection, { type: "lobbyList", lobbies: lobbyStates });
    }

    /* GAME LOGIC FUNCTIONS FROM HERE */
    private handlePlayerReady(player: Player, isReady: boolean) {
        if (!player || !player.lobbyId) {
            console.error("Matchcontroller - handlePlayerReady(): Couldn't find Player / Player not in Lobby");
            return;
        }

        const lobby = this._lobbies.get(player.lobbyId) as MatchLobby
        if (!lobby) {
            console.error("Matchcontroller - handlePlayerReady(): Couldn't find Lobby");
            return;
        }

        lobby.setPlayerReady(player.userId, isReady);

        this.broadcastToLobby(player.lobbyId, {
            type: "playerReady",
            lobby: lobby.getLobbyState()
        });
    }

    private handleStartGame(lobbyId: string) {
        const lobby = this._lobbies.get(lobbyId) as MatchLobby;
        if (!lobby) {
            console.error("Matchcontroller - handleStartGame(): Couldn't find Lobby");
            return;
        }

        if (lobby._lobbyType === 'tournament') {
            lobby.startTournament();
        }
        else {
            lobby.startGame();
        }
        //implement broadcasts here
    }

    private handleMovePaddle(player: Player, matchId: number, playerNumber: number, direction: IPaddleDirection): void {
        if (!player.lobbyId) {
            console.error("Matchcontroller - handleMovePaddle(): Player not in Lobby");
            return;
        }

        const lobby = this._lobbies.get(player.lobbyId);
        if (lobby && lobby.isGameStarted()) {
            const pongGame = lobby.getPongGame(matchId);
            if (matchId !== pongGame?.matchId) {
                return ;
            }
            if (pongGame) {
                pongGame.movePaddle(playerNumber, direction);
            }
            else {
                console.log(`PongGame for matchId ${matchId} not found in lobby ${player.lobbyId}.`);
            }
        }
        else {
            console.error(`Lobby ${player.lobbyId} not found or game not started for player ${playerNumber} during movePaddle.`);
        }
    }
}
