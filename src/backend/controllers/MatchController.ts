// MatchController.ts - Fixed version with proper lobby cleanup
import { WebSocket } from "ws";
import { randomUUID } from "crypto";
import { IClientMessage, IServerMessage, IPaddleDirection, IPlayerState } from "../../interfaces/interfaces.js";
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
                this._matchService,
                this.broadcastToLobby.bind(this, lobbyData.lobbyId)
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
                if (player && player.lobbyId) {
                    this.handleLeaveLobby(connection, player.lobbyId, data.userId!);
                }
                break;
            case "movePaddle":
                this.handleMovePaddle(player!, data.direction!);
                break;
            case "ready":
                this.handlePlayerReady(player!, data.ready)
                break;
            case "joinGame":
                this.handleJoinGame(data.lobbyId!, data.player1, data.player2);
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

    private async handleCloseSocket(connection: WebSocket) {
        const player = this._clients.get(connection);

        if (player && player.lobbyId) {
            // Handle lobby cleanup when connection is lost
            await this.cleanupPlayerFromLobby(player, player.lobbyId);
        }
        this._clients.delete(connection);
    }

    private async cleanupPlayerFromLobby(player: Player, lobbyId: string) {
        const lobby = this._lobbies.get(lobbyId);
        if (!lobby) return;

        try {
            await lobby.removePlayer(player);

            // Broadcast player left to remaining players in lobby
            this.broadcastToLobby(lobbyId, {
                type: "playerLeft",
                lobby: lobby.getLobbyState()
            });

            // Check if lobby is now empty and cleanup
            if (lobby.isEmpty()) {
                console.log(`Lobby ${lobbyId} is empty, cleaning up...`);

                // Remove from memory
                this._lobbies.delete(lobbyId);

                // Remove from database
                await this._matchService.deleteMatchByLobbyId(lobbyId);

                // Broadcast lobby list update to all clients
                this.broadcastLobbyListUpdate();

                console.log(`Lobby ${lobbyId} has been destroyed`);
            }
        } catch (error) {
            console.error(`Error cleaning up player from lobby ${lobbyId}:`, error);
        }
    }

    private sendMessage(connection: WebSocket, data: IServerMessage) {
        if (connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify(data));
        }
    }

    private broadcastToAll(data: IServerMessage): void {
        for (const [connection, player] of this._clients.entries()) {
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

    // New method to broadcast lobby list updates
    private async broadcastLobbyListUpdate(): Promise<void> {
        try {
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
                    currentPlayers: this._lobbies.get(Lobby.lobbyId)?._players.size || 0,
                    createdAt: Lobby.createdAt,
                    lobbyType: 'game' as const,
                    isStarted: false,
                }
            });

            // Broadcast updated lobby list to all clients
            this.broadcastToAll({
                type: "lobbyList",
                lobbies: openLobbies
            });
        } catch (error) {
            console.error('Error broadcasting lobby list update:', error);
        }
    }

    private async handleCreateLobby(connection: WebSocket, userId: number) {
        const lobbyId = randomUUID();

        const lobby = new MatchLobby(
            lobbyId,
            this._matchService,
            this.broadcastToLobby.bind(this, lobbyId)
        );

        this._lobbies.set(lobbyId, lobby);

        const player = await lobby.addPlayer(connection, userId);
        if (player) {
            this._clients.set(connection, player);

            this.broadcastToAll({
                type: "lobbyCreated",
                lobbyId: lobbyId,
                owner: userId,
            });

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
            });

            this.broadcastToLobby(lobbyId, {
                type: "playerJoined",
                lobby: lobby.getLobbyState()
            });
        } else {
            console.error("Matchcontroller - handleJoinLobby(): Couldn't join Lobby");
        }
    }

    private async handleLeaveLobby(connection: WebSocket, lobbyId: string, userId: number) {
        console.log(`handleLeaveLobby called for user ${userId} in lobby ${lobbyId}`);

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
            // Remove player from lobby
            await lobby.removePlayer(player);

            // Update client mapping (set to null but keep connection for potential rejoining)
            this._clients.set(connection, null);

            // Send confirmation to the leaving player
            this.sendMessage(connection, {
                type: "leftLobby",
                userId: userId
            });

            // Update lobby state for remaining players
            this.broadcastToLobby(lobbyId, {
                type: "playerLeft",
                lobby: lobby.getLobbyState()
            });

            // Check if lobby is empty and cleanup
            if (lobby.isEmpty()) {
                console.log(`Lobby ${lobbyId} is empty after player left, cleaning up...`);

                // Remove from memory
                this._lobbies.delete(lobbyId);

                // Remove from database
                await this._matchService.deleteMatchByLobbyId(lobbyId);

                // Broadcast updated lobby list to all clients
                await this.broadcastLobbyListUpdate();

                console.log(`Lobby ${lobbyId} has been destroyed`);
            } else {
                // If lobby still has players, just update the lobby list
                await this.broadcastLobbyListUpdate();
            }

        } catch (error) {
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
                currentPlayers: this._lobbies.get(Lobby.lobbyId)?._players.size || 0,
                createdAt: Lobby.createdAt,
                lobbyType: 'game' as const,
                isStarted: false,
            }
        })

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

    private handleJoinGame(lobbyId: string, player1: IPlayerState, player2: IPlayerState) {
        const lobby = this._lobbies.get(lobbyId) as MatchLobby;
        if (!lobby) {
            console.error("Matchcontroller - handleStartGame(): Couldn't find Lobby");
            return;
        }

        this.broadcastToLobby(lobbyId, {
            type: "gameJoined",
            lobbyId,
            player1,
            player2,
            gameState: lobby.getGameState()
        });
    }

    private handleStartGame(lobbyId: string) {
        const lobby = this._lobbies.get(lobbyId) as MatchLobby;
        if (!lobby) {
            console.error("Matchcontroller - handleStartGame(): Couldn't find Lobby");
            return;
        }
        lobby.startGame();
    }

    private handleMovePaddle(player: Player, direction: IPaddleDirection): void {
        if (!player.lobbyId) {
            console.error("Matchcontroller - handleMovePaddle(): Player not in Lobby");
            return;
        }

        const lobby = this._lobbies.get(player.lobbyId);
        if (lobby) {
            this.broadcastToLobby(player.lobbyId, {
                type: "paddleMove",
                playerNumber: player._playerNumber,
                direction: direction
            });
        } else {
            console.error(`Lobby ${player.lobbyId} not found for player ${player.id} during movePaddle.`);
        }
    }
}