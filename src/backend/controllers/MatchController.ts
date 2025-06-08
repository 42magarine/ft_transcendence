import { WebSocket } from "ws";
import { randomUUID } from "crypto";
import { IClientMessage, IServerMessage, IPaddleDirection, IPlayerState, ILobbyState} from "../../interfaces/interfaces.js";
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
                    this.handleLeaveLobby(connection, data.lobbyId!, data.gameIsOver!)
                break;
            case "movePaddle":
                this.handleMovePaddle(data.userId!, data.direction!, player!._lobbyId);
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
            // default ist nur dafür da fehler zu sehen, sollte später entfernt werden.
            default:
                this.sendMessage(connection, {
                    type: "error",
                    message: "not yet implemented"
                });
        }
    }

    private handleCloseSocket(connection: WebSocket) {
        const player = this._clients.get(connection);

        if (player && player.lobbyId) {
            const lobby = this._lobbies.get(player.lobbyId);
            if (lobby?.game.isRunning) {
                this.handleLeaveLobby(connection, player.lobbyId, true)
            }
            else {
                this.handleLeaveLobby(connection, player.lobbyId, false)
            }
        }
        this._clients.delete(connection);
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
            if (connection.readyState === WebSocket.OPEN) {
                this.sendMessage(connection, data);
            } else {
                console.log(`Skipping client due to readyState: ${connection.readyState}`);
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
                owner: userId
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
                lobby.game.isGameOver = true;
                if (player.userId === lobby.game.player1?.userId) {
                    lobby.game.player1Left = true;
                }
                else if (player.userId === lobby.game.player2?.userId) {
                    lobby.game.player2Left = true;
                }

                this.broadcastToLobby(lobbyId, {
                    type: "playerLeftGame",
                });
            }
            await lobby.removePlayer(player);
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
        const lobbyList: ILobbyState[] = this.getLobbyStates();
        this.broadcastToAll({
            type: "lobbyList",
            lobbies: lobbyList
        });
    }

    private getLobbyStates(): ILobbyState[] {
        return Array.from(this._lobbies.values()).map(lobby => lobby.getLobbyState());
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
        //removeLobby logic here
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

    private handleMovePaddle(requestingUserId: number, direction: IPaddleDirection, lobbyId: string): void {
        const lobby = this._lobbies.get(lobbyId);

        if (!lobby) {
            console.warn(`Lobby with ID ${lobbyId} not found for userId ${requestingUserId}.`);
            return;
        }

        const game = lobby.game;
        if (!game) {
            console.error(`PongGame instance not found in lobby ${lobbyId}.`);
            return;
        }
        game.movePaddle(requestingUserId, direction);
    }
}
