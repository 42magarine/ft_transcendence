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
                this.broadcast.bind(this),
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
            this.handleClose(connection);
        });

        this.sendMessage(connection, {
            type: "connection",
            message: "Connected to game server",
        });
    }

    private sendMessage(connection: WebSocket, data: IServerMessage) {
        if (connection.readyState === WebSocket.OPEN) {
            // console.log("sendMessage (backend->frontend): ", data)
            connection.send(JSON.stringify(data));
        }
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
                this.handleLeaveLobby(connection, data.lobbyId!)
                break;
            case "movePaddle":
                this.handleMovePaddle(connection, player!, data.direction!);
                break;
            case "ready":
                this.handlePlayerReady(connection, player!, data.ready)
                break;
            case "startGame":
                this.handleStartGame(connection, player!);
                break;
            case "getLobbyList":
                this.handleGetLobbyList(connection);
                break;
            case "getLobbyState":
                this.handleGetLobbyState(connection, data.lobbyId!);
                break;
            default:
                this.sendMessage(connection, {
                    type: "error",
                    message: "not yet implemented"
                });
                // throw Error("Backend: invalid message type received");
        }
    }

    private handleClose(connection: WebSocket) {
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

    //receives lobbyId and distributes a IServerMessage to all connected users in that lobby!!!!
    private broadcast(lobbyId: string, data: IServerMessage): void {
        for (const [connection, player] of this._clients.entries()) {
            // player?.lobbyId === lobbyId &&  removed from condition
            if (player?.lobbyId === lobbyId && connection.readyState === WebSocket.OPEN) {
                connection.send(JSON.stringify(data));
            }
        }
    }

    private broadcastToAll(data: IServerMessage): void {
        console.log(`Broadcasting to all clients. Total clients: ${this._clients.size}`);
        console.log('Message to broadcast:', data);

        let sentCount = 0;
        for (const [connection, player] of this._clients.entries()) {
            console.log(`Client ${sentCount + 1}: readyState=${connection.readyState}, player=${player?.userId || 'no player'}`);

            if (connection.readyState === WebSocket.OPEN) {
                this.sendMessage(connection, data);
                sentCount++;
                console.log(`Message sent to client ${sentCount}`);
            } else {
                console.log(`Skipping client due to readyState: ${connection.readyState}`);
            }
        }
        console.log(`Total messages sent: ${sentCount}`);
    }

    private async handleCreateLobby(connection: WebSocket, userId: number) {
        console.log(`handleCreateLobby called for userId: ${userId}`);
        console.log(`Current clients count: ${this._clients.size}`);
        const lobbyId = randomUUID();

        const lobby = new MatchLobby(
            lobbyId,
            this.broadcast.bind(this),
            this._matchService
        );

        this._lobbies.set(lobbyId, lobby);

        const player = await lobby.addPlayer(connection, userId);
        if (player) {
            this._clients.set(connection, player);

            console.log(`After adding player, clients count: ${this._clients.size}`);
            console.log("About to broadcast lobbyCreated");

            this.broadcastToAll({
                type: "lobbyCreated",
                lobbyId: lobbyId,
                owner: userId,
                playerNumber: player._playerNumber
            });
        }
    }

    private async handleJoinLobby(connection: WebSocket, userId: number, lobbyId: string) {
        if (!userId || !lobbyId) {
            this.sendMessage(connection, {
                type: "error",
                message: "UserId and LobbyId are required"
            });
            return;
        }

        const lobby = this._lobbies.get(lobbyId);
        if (!lobby) {
            this.sendMessage(connection, {
                type: "error",
                message: "Lobby not found"
            });
            return;
        }

        const player = await lobby.addPlayer(connection, userId);
        if (player) {
            this._clients.set(connection, player);


            this.sendMessage(connection, {
                type: "joinedLobby",
                lobbyId: lobbyId,
                playerNumber: player._playerNumber
            });
        }
        else {
            this.sendMessage(connection, {
                type: "error",
                message: "Could not join lobby (full or error)"
            });
        }
    }

    private async handleLeaveLobby(connection: WebSocket, lobbyId: string) {
        const lobby = this._lobbies.get(lobbyId);
        if (!lobby) {
            this.sendMessage(connection, {
                type: "error",
                message: "Lobby not found"
            });
            return;
        }

        const player = this._clients.get(connection);
        if (!player) {
            this.sendMessage(connection, {
                type: "error",
                message: "Player not found in this lobby"
            });
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
        }
        catch (error) {
            console.error("Error leaving lobby:", error);
            this.sendMessage(connection, {
                type: "error",
                message: "Failed to leave lobby"
            });
        }
    }

    private async handleGetLobbyState(connection: WebSocket, lobbyId: string) {
        const lobby = this._lobbies.get(lobbyId);

        if (!lobby) {
            this.sendMessage(connection, {
                type: "error",
                message: "No Lobby like this lol"
            })
            return null;
        }

        this.sendMessage(connection, {
            type: 'lobbyState',
            lobby: lobby.getLobbyState()
        })
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
                currentPlayers: this._lobbies.get(Lobby.lobbyId)!._players.size,
                createdAt: Lobby.createdAt,
                lobbyType: 'game' as const,
                isStarted: false,
                //lobbyPlayers -> lobbyParticipants ???
            }
        })

        this.sendMessage(connection, { type: "lobbyList", lobbies: openLobbies });
    }

    /* GAME LOGIC FUNCTIONS FROM HERE */
    private handlePlayerReady(connection: WebSocket, player: Player, isReady: boolean) {
        if (!player || !player.lobbyId) {
            this.sendMessage(connection, {
                type: "error",
                message: "not in a lobby"
            })
            return;
        }

        const lobby = this._lobbies.get(player.lobbyId) as MatchLobby
        if (!lobby) {
            this.sendMessage(connection, {
                type: "error",
                message: "Lobby not found"
            })
            return;
        }
        lobby.setPlayerReady(player.id, isReady)
    }

    private handleStartGame(connection: WebSocket, player: Player) {
        if (!player || !player.lobbyId) {
            this.sendMessage(connection, {
                type: "error",
                message: "not in lobby"
            })
            return;
        }

        const lobby = this._lobbies.get(player.lobbyId) as MatchLobby;
        if (!lobby) {
            this.sendMessage(connection, {
                type: "error",
                message: "lobby not found"
            })
            return;
        }

        if (lobby.getCreatorId() !== player.userId) {
            this.sendMessage(connection, {
                type: "error",
                message: "Only creator can start game"
            })
            return;
        }

        if (lobby.getPlayerCount() < 2) {
            this.sendMessage(connection, {
                type: "error",
                message: "Need at least 2 players"
            })
            return;
        }

        if (!lobby.checkAllPlayersReady()) {
            this.sendMessage(connection, {
                type: "error",
                message: "All player must be ready"
            })
            return;
        }
        lobby.startGame();
    }

    private handleMovePaddle(connection: WebSocket, player: Player, direction: IPaddleDirection): void {
        if (!player.lobbyId) {
            this.sendMessage(connection, {
                type: "error",
                message: "Player not in a lobby."
            });
            return;
        }

        const lobby = this._lobbies.get(player.lobbyId);
        if (lobby) {
            this.broadcast(player.lobbyId, {
                type: "paddleMove",
                playerNumber: player._playerNumber,
                direction: direction
            });
        }
        else {
            console.error(`Lobby ${player.lobbyId} not found for player ${player.id} during movePaddle.`);
            this.sendMessage(connection, { type: "error", message: "Internal server error: Lobby not found." });
        }
    }
}
