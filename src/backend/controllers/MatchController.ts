import { randomUUID } from "crypto";
import { ClientMessage, createLobbyMessage, GameActionMessage, joinLobbyMessage, ReadyMessage, ServerMessage } from "../../interfaces/interfaces.js";
import { Player } from "../gamelogic/components/Player.js";
import { MessageHandlers } from "../services/MessageHandlers.js";
import { UserService } from "../services/UserService.js";
import { WebSocket } from "ws";
import { MatchLobby } from "../lobbies/MatchLobby.js";
import { MatchService } from "../services/MatchService.js";

export class MatchController {
    protected _lobbies: Map<string, MatchLobby>;
    protected _clients: Map<WebSocket, Player | null>; //is EMPTY on startup
    protected _handlers: MessageHandlers;
    protected _userService: UserService;
    protected _invites: Map<string, { from: number, to: number, lobbyId: string, expires: Date }>
    private _matchService: MatchService;

    constructor(userService: UserService, lobbies: Map<string, MatchLobby>) {
        this._userService = userService;
        this._lobbies = lobbies;
        this._matchService = new MatchService(userService);
        this._clients = new Map<WebSocket, Player | null>(); // player will be null on creation
        this._handlers = new MessageHandlers(this.broadcast.bind(this));
        this._invites = new Map<string, { from: number, to: number, lobbyId: string, expires: Date }>();
        //should Invites be in matchcontroller or userController?

        setInterval(() => {
            this.cleanUpInvites();
        }, 60000);
        this.initMatchController();
    }

    // automated function that cleans up invites every minute(set in setInterval)
    private async cleanUpInvites() {
        const now = new Date();

        for (const [inviteId, invite] of this._invites.entries()) {
            if (invite.expires < now) {
                this._invites.delete(inviteId);
            }

            const lobby = this._lobbies.get(invite.lobbyId)
            if (lobby && lobby.isEmpty()) {
                this._lobbies.delete(invite.lobbyId);
            }
        }
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
    protected handleMessage(message: string | Buffer, connection: WebSocket): void {
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
                this.handleJoinLobby(connection, (data as joinLobbyMessage).userId!, (data as joinLobbyMessage).lobbyId)
                break;
            case "createLobby":
                this.handleCreateLobby(connection, (data as createLobbyMessage).userId!)
                break;
            case "leaveLobby":
                this.handleLeaveLobby(connection)
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

    protected sendMessage(connection: WebSocket, data: ServerMessage): void {
        if (connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify(data));
        }
    }

    protected handleClose(connection: WebSocket): void {
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
    protected broadcast(lobbyId: string, data: ServerMessage): void {
        for (const [connection, player] of this._clients.entries()) {
            if (player?.lobbyId === lobbyId && connection.readyState === WebSocket.OPEN) {
                connection.send(JSON.stringify(data));
            }
        }
    }

    //creates a lobbyId and a lobby object with that lobbyid
    // -> that includes the game,
    // -> the lobby and
    // -> loads a player into that lobby playerlist!
    // -> sends back message to client "lobbyCreated" with lobbyId and player.Id which should also be user.Id!!!
    protected handleCreateLobby(connection: WebSocket, userId: number) {
        const lobbyId = randomUUID();
        const lobby = this.createLobby(lobbyId, userId);

        this._lobbies.set(lobbyId, lobby);

        const player = lobby.addPlayer(connection, userId);

        if (player) {
            this._clients.set(connection, player); // set into clients map for future use!
            // send ANOTHER message to frontend with lobbyCreated!!
            this.sendMessage(connection, {
                type: "lobbyCreated",
                lobbyId: lobbyId,
                playerNumber: player._playerNumber
            })
        }
    }

    protected handleJoinLobby(connection: WebSocket, userId: number, lobbyId?: string) {
        console.log("handleJoinLobby")
        if (!lobbyId) {
            this.sendMessage(connection, {
                type: "error",
                message: "Lobby Id is required"
            })
            return;
        }
        console.log("has lob id 1 ")
        console.log(lobbyId)
        console.log(this._lobbies)
        const lobby = this._lobbies.get(lobbyId)

        console.log(lobby)
        if (!lobby) {
            this.sendMessage(connection, {
                type: "error",
                message: "Lobby no idea"
            })
            return;
        }
        console.log("has lob id 2 ")

        console.log("addPlayer")
        const player = lobby.addPlayer(connection, userId)
        console.log(player)
        if (player) {
            this._clients.set(connection, player)
        }

        this.sendMessage(connection, {
            type: "joinedLobby",
            lobbyId: lobbyId,
            playerNumber: player!._playerNumber
        })
    }

    protected handleLeaveLobby(connection: WebSocket) {
        const player = this._clients.get(connection);

        if (player && player.lobbyId) {
            const lobby = this._lobbies.get(player.lobbyId);

            if (lobby)
                lobby.removePlayer(player);

            if (lobby?.isEmpty()) {
                this._lobbies.delete(player.lobbyId)
            }
        }

        this._clients.set(connection, null)

        this.sendMessage(connection, {
            type: "leftLobby"
        })
    }

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

    private async handleGetLobbyList(connection: WebSocket) {
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
                isPublic: !Lobby.hasPassword,
                hasPassword: Lobby.hasPassword || false,
                createdAt: Lobby.createdAt,
                lobbyType: 'game' as const,
                isStarted: false
            }
        })

        this.sendMessage(connection, { type: "lobbyList", lobbies: openLobbies });
    }

    //create ne lobby object with id, broadcast and matchservice!
    protected createLobby(lobbyId: string, userId: number): MatchLobby {
        this._matchService.createInitialMatchModelforLobby(lobbyId, userId)

        return new MatchLobby(
            lobbyId,
            this.broadcast.bind(this),
            this._matchService
        )
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

// private handleInvite(connection: WebSocket, fromUserId?: number, toUserId?: number) {
//     if (!fromUserId || !toUserId) {
//         this.sendMessage(connection, {
//             type: "error",
//             message: "Not user to send from/to"
//         })
//         return;
//     }

//     const lobbyId = randomUUID();
//     const lobby = this.createLobby(lobbyId);
//     this._lobbies.set(lobbyId, lobby);

//     const inviteId = randomUUID();

//     const expires = new Date();
//     expires.setMinutes(expires.getMinutes() + 5)

//     this._invites.set(inviteId, {
//         from: fromUserId,
//         to: toUserId,
//         lobbyId,
//         expires
//     })

//     this.sendMessage(connection, {
//         type: "inviteSent",
//         inviteId,
//         toUserId,
//         lobbyId
//     })

//     this.NotifyUserOfInvite(toUserId, fromUserId, inviteId)
// }

// private async NotifyUserOfInvite(toUserId: number, fromUserId: number, inviteId: string) {
//     for (const [conn, player] of this._clients.entries()) {
//         if (player?.userId === toUserId) {
//             const fromUser = await this._userService.findUserById(fromUserId);
//             this.sendMessage(conn, {
//                 type: "inviteReceived",
//                 inviteId,
//                 fromUserId,
//                 fromUsername: fromUser?.username || "unknown user"
//             })
//             return;
//         }
//     }
// }

// private handleAcceptInvite(connection: WebSocket, userId?: number, inviteId?: string) {
//     if (!userId || !inviteId) {
//         this.sendMessage(connection, {
//             type: "error",
//             message: "user or invite not found"
//         })
//         return;
//     }

//     const invite = this._invites.get(inviteId)
//     if (!invite || invite.to !== userId) {
//         this.sendMessage(connection, {
//             type: "error",
//             message: "invite not found in list or not for user"
//         })
//         return;
//     }

//     const lobby = this._lobbies.get(invite.lobbyId)
//     if (!lobby) {
//         this.sendMessage(connection, {
//             type: "error",
//             message: "lobby not found"
//         })
//         return;
//     }

//     const player = lobby.addPlayer(connection, userId);
//     if (player) {
//         this._clients.set(connection, player);
//     }

//     this.sendMessage(connection, {
//         type: "joinedLobby",
//         lobbyId: invite.lobbyId,
//         playerNumber: player?.id
//     })

//     this._invites.delete(inviteId);
// }

// private handleDeclineInvite(connection: WebSocket, userId?: number, inviteId?: string) {
//     if (!userId || !inviteId) {
//         return
//     }
//     const invite = this._invites.get(inviteId);
//     if (!invite || invite.to !== userId)
//         return

//     this._invites.delete(inviteId)

//     this.NotifyUserOfDeclinedInvite(invite.from, userId);

//     const lobby = this._lobbies.get(invite.lobbyId)
//     if (lobby && lobby.isEmpty()) {
//         this._lobbies.delete(invite.lobbyId)
//     }

//     this.sendMessage(connection, {
//         type: "inviteDeclined",
//         inviteId
//     })
// }

// private async NotifyUserOfDeclinedInvite(userId: number, declinedBy: number) {
//     for (const [conn, player] of this._clients.entries()) {
//         if (player?.userId === userId) {
//             const decliningUser = await this._userService.findUserById(declinedBy);
//             this.sendMessage(conn, {
//                 type: "inviteDeclined",
//                 byUserId: declinedBy,
//                 declinedByUser: decliningUser?.username
//             })
//             return;
//         }
//     }
// }
