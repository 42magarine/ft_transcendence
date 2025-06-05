import { WebSocket } from "ws";
import { randomUUID } from "crypto";
import { IClientMessage, IServerMessage, IPaddleDirection } from "../../interfaces/interfaces.js";
import { Player } from "../gamelogic/components/Player.js";
import { MatchLobby } from "../lobbies/MatchLobby.js";
import { MatchService } from "../services/MatchService.js";

export class MatchController {
    private _matchService: MatchService;
    private _lobbies: Map<string, MatchLobby>;
    private _clients: Map<WebSocket, Player | null>;

    constructor(matchService: MatchService) {
        this._matchService = matchService;
        this._lobbies = new Map();
        this._clients = new Map();
        this.initOpenLobbies();
    }

    private async initOpenLobbies() {
        const openLobbies = await this._matchService.getOpenLobbies();

        for (const lobbyData of openLobbies) {
            const lobby = new MatchLobby(
                lobbyData.lobbyId,
                this._matchService
            );
            this._lobbies.set(lobbyData.lobbyId, lobby);
        }
    }

    public handleConnection(connection: WebSocket) {
        this._clients.set(connection, null);

        connection.on("message", (message: string | Buffer) => {
            this.handleMessage(message, connection);
        });

        connection.on("close", () => {
            this.handleCloseSocket(connection);
        });

        this.sendMessage(connection, {
            type: "connection",
            message: "Connected to game server",
        });
    }

    private handleMessage(message: string | Buffer, connection: WebSocket) {
        let data: IClientMessage;
        try {
            data = JSON.parse(message.toString()) as IClientMessage;
        } catch (error: unknown) {
            console.error("Invalid message format", error)
            return;
        }

        const player = this._clients.get(connection);
        switch (data.type) {
            case "joinLobby":
                this.handleJoinLobby(connection, data.userId!, data.lobbyId!)
                break;
            case "createLobby":
                this.handleCreateLobby(connection, data.userId!)
                break;
            case "leaveLobby":
                if (player) //todo fix in frontend leave route and button sends this twice
                    this.handleLeaveLobby(connection, data.lobbyId!)
                break;
            case "movePaddle":
                this.handleMovePaddle(player!, data.direction!);
                break;
            case "ready":
                this.handlePlayerReady(player!, data.ready)
                break;
            case "startGame":
                this.handleStartGame(connection, player!);
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
            // throw Error("Backend: invalid message type received");
        }
    }

    private handleCloseSocket(connection: WebSocket) {
        const player = this._clients.get(connection);

        if (player && player.lobbyId) {
            const lobby = this._lobbies.get(player.lobbyId);

            if (lobby) {
                lobby.removePlayer(player);

                if (lobby.isEmpty()) {
                    this._lobbies.delete(player.lobbyId);
                }
            }
        }
        this._clients.delete(connection);
    }

    private sendMessage(connection: WebSocket, data: IServerMessage) {
        if (connection.readyState === WebSocket.OPEN) {
            console.log("sendMessage (backend->frontend): ", data)
            connection.send(JSON.stringify(data));
        }
    }

    private broadcastToAll(data: IServerMessage): void {
        // console.log(`Broadcasting to all clients. Total clients: ${this._clients.size}`);
        // console.log('Message to broadcast:', data);

        let sentCount = 0;
        for (const [connection, player] of this._clients.entries()) {
            console.log(`Client ${sentCount + 1}: readyState=${connection.readyState}, player=${player?.userId || 'no player'}`);

            if (connection.readyState === WebSocket.OPEN) {
                this.sendMessage(connection, data);
                sentCount++;
                // console.log(`Message sent to client ${sentCount}`);
            } else {
                console.log(`Skipping client due to readyState: ${connection.readyState}`);
            }
        }
        // console.log(`Total messages sent: ${sentCount}`);
    }

    private broadcastToLobby(lobbyId: string, data: IServerMessage): void {
        // console.log(`Broadcasting to lobby ${lobbyId}`);

        let sentCount = 0;
        for (const [connection, player] of this._clients.entries()) {
            if (
                connection.readyState === WebSocket.OPEN &&
                player &&
                player._lobbyId === lobbyId
            ) {
                this.sendMessage(connection, data);
                sentCount++;
                // console.log(`Message sent to player ${player._userId} in lobby ${lobbyId}`);
            }
        }

        // console.log(`Total messages sent to lobby ${lobbyId}: ${sentCount}`);
    }

    private async handleCreateLobby(connection: WebSocket, userId: number) {
        // console.log(`handleCreateLobby called for userId: ${userId}`);
        // console.log(`Current clients count: ${this._clients.size}`);
        const lobbyId = randomUUID();

        const lobby = new MatchLobby(
            lobbyId,
            this._matchService
        );

        this._lobbies.set(lobbyId, lobby);

        const player = await lobby.addPlayer(connection, userId);
        if (player) {
            this._clients.set(connection, player);

            // console.log(`After adding player, clients count: ${this._clients.size}`);
            // console.log("About to broadcast lobbyCreated");

            this.broadcastToAll({
                type: "lobbyCreated",
                lobbyId: lobbyId,
                owner: userId, //should prob be creatorId for concurrency
                // playerNumber: player._playerNumber //prob don't need this since websocket is unique to client anyways
            });
            console.log("handleCreateLobby: lobbyState sent")
            this.broadcastToLobby(lobbyId, {
                type: "lobbyState",
                lobby: lobby.getLobbyState()
            });

        }
    }

    private async handleJoinLobby(connection: WebSocket, userId: number, lobbyId: string) {
        if (!userId || !lobbyId) {
            console.error("Matchcontroller - handleJoinLobby(): UserId and LobbyId are required");
            return;
        }

        const lobby = this._lobbies.get(lobbyId);
        if (!lobby) {
            console.error("Matchcontroller - handleJoinLobby(): Couldn't join Lobby");
            return;
        }

        const player = await lobby.addPlayer(connection, userId);
        if (player) {
            this._clients.set(connection, player);

            this.broadcastToAll({
                type: "joinedLobby",
                lobbyId: lobbyId,
                owner: userId,
                // playerNumber: player._playerNumber //prob don't need this since websocket is unique to client anyways
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

    private async handleLeaveLobby(connection: WebSocket, lobbyId: string) {
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
            await lobby.removePlayer(player);

            // Spieler aus _clients Map entfernen
            // this._clients.delete(connection);
            this._clients.set(connection, null);

            if (lobby.isEmpty()) {
                this._lobbies.delete(lobbyId);
                await this._matchService.deleteMatchByLobbyId(lobbyId);
            }

            this.broadcastToAll({
                type: "leftLobby"
            });

            this.broadcastToLobby(lobbyId, {
                type: "playerLeft",
                lobby: lobby.getLobbyState()
            });
        }
        catch (error) {
            console.error("Matchcontroller - handleLeaveLobby(): Player failed to leave Lobby");
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
        console.log("handleGetLobbyList")
        const openMatchModels = await this._matchService.getOpenLobbies();

        const openLobbies = openMatchModels.map(Lobby => {
            const activeLobby = Array.from(this._lobbies.values()).find(l =>
                l.getGameId() === Lobby.matchModelId
            );

            if (activeLobby) {
                return activeLobby.getLobbyState();
            }

            return {
                id: Lobby.matchModelId.toString(),
                lobbyId: Lobby.lobbyId,
                name: `Lobby ${Lobby.matchModelId}`,
                creatorId: Lobby.player1.id,
                maxPlayers: Lobby.maxPlayers,
                currentPlayers: this._lobbies.get(Lobby.lobbyId)!._players.size,
                createdAt: Lobby.createdAt,
                lobbyType: 'game' as const,
                isStarted: false,
                //lobbyPlayers -> lobbyParticipants ???
            }
        })
        //broadcastToAll ?
        this.sendMessage(connection, { type: "lobbyList", lobbies: openLobbies });
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
        lobby.setPlayerReady(player.id, isReady);

        this.broadcastToLobby(player.lobbyId, {
            type: "playerReady",
            lobby: lobby.getLobbyState()
        });

    }

    private handleStartGame(connection: WebSocket, player: Player) {
        if (!player || !player.lobbyId) {
            console.error("Matchcontroller - handleStartGame(): Couldn't find Player / Player not in Lobby");
            return;
        }

        const lobby = this._lobbies.get(player.lobbyId) as MatchLobby;
        if (!lobby) {
            console.error("Matchcontroller - handleStartGame(): Couldn't find Lobby");
            return;
        }
        lobby.startGame();
        //implement broadcasts here
    }

    private handleMovePaddle(player: Player, direction: IPaddleDirection): void {
        if (!player.lobbyId) {
            console.error("Matchcontroller - handleMovePaddle(): =Player not in Lobby");
            return;
        }

        const lobby = this._lobbies.get(player.lobbyId);
        if (lobby) {
            // send full gamestate to frontend here later!
            this.broadcastToLobby(player.lobbyId, {
                type: "paddleMove",
                playerNumber: player._playerNumber,
                direction: direction
            });
        }
        else {
            console.error(`Lobby ${player.lobbyId} not found for player ${player.id} during movePaddle.`);
        }
    }
}
