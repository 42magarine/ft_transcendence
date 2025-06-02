import { WebSocket } from "ws";
import { randomUUID } from "crypto";
import { Player } from "../gamelogic/components/Player.js";
import { MatchService } from "../services/MatchService.js";
import { MessageHandlers } from "../services/MessageHandlers.js";
import { MatchLobby } from "../lobbies/MatchLobby.js";
import { ClientMessage, createLobbyMessage, GameActionMessage, joinLobbyMessage, leaveLobbyMessage, ReadyMessage, ServerMessage } from "../../interfaces/interfaces.js";

export class MatchController {
    private _matchService: MatchService;
    private _lobbies: Map<string, MatchLobby>;
    private _clients: Map<WebSocket, Player | null>;
    private _handlers: MessageHandlers;

    constructor(matchService: MatchService) {
        this._matchService = matchService;
        this._lobbies = new Map();
        this._clients = new Map();
        this._handlers = new MessageHandlers(this.broadcast.bind(this));
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

    private sendMessage(connection: WebSocket, data: ServerMessage) {
        if (connection.readyState === WebSocket.OPEN) {
            console.log("sendMessage (backend->frontend): ", data)
            connection.send(JSON.stringify(data));
        }
    }

    private handleMessage(message: string | Buffer, connection: WebSocket) {
        let data: ClientMessage;
        try {
            data = JSON.parse(message.toString()) as ClientMessage;
        }
        catch (error: unknown) {
            console.error("Invalid message format", error)
            return;
        }

        const player = this._clients.get(connection);

        switch (data.type) {
            case "createLobby":
                this.handleCreateLobby(connection, data.userId!)
                break;
            case "joinLobby":
                this.handleJoinLobby(connection, data.userId!, data.lobbyId!)
                break;
            case "leaveLobby":
                this.handleLeaveLobby(connection, data.lobbyId!)
                break;
            case "gameAction":
                if (player) {
                    this._handlers.handleGameAction(player, (data as GameActionMessage))
                }
                break;
            case "ready":
                this.handlePlayerReady(connection, player!, (data as ReadyMessage).ready)
                break;
            case "startGame":
                this.handleStartGame(connection, player!);
                break;
            case "pauseGame":
                this.handlePauseGame(connection, player!);
                break;
            case "resumeGame":
                this.handleResumeGame(connection, player!)
                break;
            case "getLobbyList":
                this.handleGetLobbyList(connection);
                break;
            case "getLobbyById":
                this.handleGetLobbyById(connection, data.lobbyId!)
            default:
                throw Error("WTF DUDE!!!");
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

    //receives lobbyId and distributes a servermessage to all connected users in that lobby!!!!
    private broadcast(lobbyId: string, data: ServerMessage): void {
        for (const [connection, player] of this._clients.entries()) {
            // player?.lobbyId === lobbyId &&  removed from condition
            if (connection.readyState === WebSocket.OPEN) {
                connection.send(JSON.stringify(data));
            }
        }
    }

    private async handleCreateLobby(connection: WebSocket, userId: number) {
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

            this.sendMessage(connection, {
                type: "lobbyCreated",
                lobbyId: lobbyId,
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
            // Spieler aus Lobby + DB entfernen
            await lobby.removePlayer(player);

            // Spieler aus _clients Map entfernen
            this._clients.delete(connection);

            if (lobby.isEmpty()) {
                this._lobbies.delete(lobbyId);

                // Match aus DB löschen
                await this._matchService.deleteMatchByLobbyId(lobbyId);
            }

            this.sendMessage(connection, {
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

    //pretty self explanatory -> get out of active lobbies -> maybe implement retrieval from MatchModels if not in active lobby map!!
    private async handleGetLobbyById(connection: WebSocket, lobbyId: string) {
        const lobby = this._lobbies.get(lobbyId);

        if (!lobby) {
            this.sendMessage(connection, {
                type: "error",
                message: "No Lobby like this lol"
            })
            return null;
        }

        this.sendMessage(connection, {
            type: 'lobbyInfo',
            lobby: lobby.getLobbyInfo()
        })
    }

    //this retrieves from matchmodels for older lobbies / pending lobbies and stuff!
    private async handleGetLobbyList(connection: WebSocket) {
        //getopenlobbies gets all matchmodels with state 'pending' and bool isOpen == true!!!
        const openMatchModels = await this._matchService.getOpenLobbies();

        const openLobbies = openMatchModels.map(Lobby => {
            const activeLobby = Array.from(this._lobbies.values()).find(l =>
                l.getGameId() === Lobby.matchModelId
            );

            if (activeLobby) {
                return activeLobby.getLobbyInfo();
            }

            return {
                id: Lobby.matchModelId.toString(),
                lobbyId: Lobby.lobbyId,
                name: `Lobby ${Lobby.matchModelId}`,
                creatorId: Lobby.player1.id,
                maxPlayers: Lobby.maxPlayers,
                currentPlayers: Lobby.lobbyParticipants?.length,
                createdAt: Lobby.createdAt,
                lobbyType: 'game' as const,
                isStarted: false
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

    private handlePauseGame(connection: WebSocket, player: Player) {
        if (!player || !player.lobbyId) { return; }

        const lobby = this._lobbies.get(player.lobbyId) as MatchLobby
        if (lobby && lobby.getCreatorId() === player.userId) {
            lobby.pauseGame();
        } else {
            this.sendMessage(connection, {
                type: "error",
                message: "Only lobby creator can pause game"
            })
        }
    }

    private handleResumeGame(connection: WebSocket, player: Player) {
        if (!player || !player.lobbyId) {
            return;
        }

        const lobby = this._lobbies.get(player.lobbyId) as MatchLobby
        if (lobby && lobby.getCreatorId() === player.userId) {
            lobby.resumeGame();
        }
        else {
            this.sendMessage(connection, {
                type: "error",
                message: "Only lobby creator can resume game"
            })
        }
    }
}
