import { randomUUID } from "crypto";
import { ClientMessage, createLobbyMessage, GameActionMessage, joinLobbyMessage, leaveLobbyMessage, ReadyMessage, ServerMessage } from "../../interfaces/interfaces.js";
import { Player } from "../gamelogic/components/Player.js";
import { MessageHandlers } from "../services/MessageHandlers.js";
import { UserService } from "../services/UserService.js";
import { WebSocket } from "ws";
import { MatchLobby } from "../lobbies/MatchLobby.js";
import { MatchService } from "../services/MatchService.js";

export class MatchController {
    private _lobbies: Map<string, MatchLobby>;
    private _clients: Map<WebSocket, Player | null>; //is EMPTY on startup
    private _handlers: MessageHandlers;
    private _userService: UserService;
    private _matchService: MatchService;

    constructor(userService: UserService, lobbies: Map<string, MatchLobby>) {
        this._userService = userService;
        this._lobbies = lobbies;
        this._matchService = new MatchService(userService);
        this._clients = new Map<WebSocket, Player | null>(); // player will be null on creation
        this._handlers = new MessageHandlers(this.broadcast.bind(this));
        this.initMatchController();
    }

    //should get all open lobbies out of DB on startup and then save them into the lobby MAP
    private async initMatchController() {
        if (this._lobbies.size === 0) {
            const openLobbiesInDB = await this._matchService.getOpenLobbies()

            for (const MatchModelLobby of openLobbiesInDB) {
                const lobbyFromBackend = new MatchLobby(MatchModelLobby.lobbyId, this.broadcast.bind(this), this._matchService)
                this._lobbies.set(MatchModelLobby.lobbyId, lobbyFromBackend);
            }
        }
    }

    //connection handle function for message case / close case.
    // returns message "connected to game server" to client!
    public handleConnection = (connection: WebSocket, userId?: number): void => {
        this._clients.set(connection, null);

        //"message" is the event, message is what we send to handleMessage!
        connection.on("message", (message: string | Buffer): void => {
            this.handleMessage(message, connection);
        });

        connection.on("close", (): void => {
            this.handleClose(connection);
        });

        this.sendMessage(connection, {
            type: "connection",
            message: "Connected to game server",
            userId: userId
        });
    };

    //actual handle connection message function
    //that triggers on: "message" case in handleConnection function!
    private handleMessage(message: string | Buffer, connection: WebSocket): void {
        let data: ClientMessage;
        try {
            data = JSON.parse(message.toString()) as ClientMessage;
        } catch (error: unknown) {
            console.error("Invalid message format", error)
            return;
        }

        //Player will be null on startup
        //-> when creating / joining lobby on subsequent calls should be able to get a player to the corresponding lobby!
        const player = this._clients.get(connection);

        switch (data.type) {
            case "joinLobby":
                this.handleJoinLobby(connection, (data as joinLobbyMessage).userId!, (data as joinLobbyMessage).lobbyId!)
                break;
            case "createLobby":
                this.handleCreateLobby(connection, (data as createLobbyMessage).userId!)
                break;
            case "leaveLobby":
                this.handleLeaveLobby(connection, (data as leaveLobbyMessage).lobbyId!)
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

    private sendMessage(connection: WebSocket, data: ServerMessage): void {
        if (connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify(data));
        }
    }

    private handleClose(connection: WebSocket): void {
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

    //creates a lobbyId and a lobby object with that lobbyid
    // -> that includes the game,
    // -> the lobby and
    // -> loads a player into that lobby playerlist!
    // -> sends back message to client "lobbyCreated" with lobbyId and player.Id which should also be user.Id!!!

    // maybe should also add maxPlayercount into this function OR we create handleCreateTournamentLobby (maybe better)
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
        const player = this._clients.get(connection);
        //retrieve player from active clients

        if (player && player.lobbyId) {
            const lobby = this._lobbies.get(player.lobbyId);
            //if player is in lobby (from active lobbies in memory!)
            if (lobby) //remove from lobby
            {
                lobby.removePlayer(player);
            }
            //if lobby now empty delete lobby from active lobbies -> also need to delete from DB now!!!!
            if (lobby?.isEmpty()) {
                this._lobbies.delete(player.lobbyId)
                await this._matchService.deleteMatchByLobbyId(lobbyId);
                //Write delete lobby from MatchModel Datatable in DB!!!!
            }
        }

        //?? what should this do lol
        //hmmmmmm let me think about it
        //set connection to null so association with player disappears
        this._clients.set(connection, null)

        //then send message to frontend
        this.sendMessage(connection, {
            type: "leftLobby"
        })

        //should close connection? -> no will be needed for other commands
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
    // FREDDY SCHWING DEIN ARSCH HIER DRAN UND CHECK DIE AB! <3
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
