import { randomUUID } from "crypto";
import { ClientMessage, createLobbyMessage, GameActionMessage, joinLobbyMessage, ReadyMessage, ServerMessage } from "../../interfaces/interfaces.js";
import { Player } from "../gamelogic/components/Player.js";
import { MessageHandlers } from "../services/MessageHandlers.js";
import { UserService } from "../services/UserService.js";
import { WebSocket } from "ws";
import { FastifyReply, FastifyRequest } from "fastify";
import { MatchLobby } from "../lobbies/MatchLobby.js";
import { MatchService } from "../services/MatchService.js";

export class MatchController {
    protected _lobbies: Map<string, MatchLobby>;
    protected _clients: Map<WebSocket, Player | null>; //
    protected _handlers: MessageHandlers;
    protected _userService: UserService;
    protected _invites: Map<string, { from: number, to: number, lobbyId: string, expires: Date }>
    private _matchService: MatchService;

    constructor(userService: UserService, lobbies: Map<string, MatchLobby>) {
        this._userService = userService;
        this._lobbies = lobbies;
        this._matchService = new MatchService(userService);
        this._clients = new Map<WebSocket, Player | null>();
        this._handlers = new MessageHandlers(this.broadcast.bind(this));
        this._invites = new Map<string, { from: number, to: number, lobbyId: string, expires: Date }>();

        setInterval(() => {
            this.cleanUpInvites();
        }, 60000);
    }

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

    public handleConnection = (connection: WebSocket, userId?: number): void => {
        console.log("A new client connected!");
        this._clients.set(connection, null);

        connection.on("message", (message: string | Buffer): void => {
            // console.log(connection);
            // console.log(message);
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

    protected handleMessage(message: string | Buffer, connection: WebSocket): void {
        let data: ClientMessage;
        try {
            data = JSON.parse(message.toString()) as ClientMessage;
            console.log(data);
        } catch (error: unknown) {
            console.error("Invalid message format", error)
            return;
        }
        console.log(data);
        const player = this._clients.get(connection);

        switch (data.type) {
            case "joinLobby":
                this.handleJoinLobby(connection, (data as joinLobbyMessage).userId, (data as joinLobbyMessage).lobbyId)
                break;
            case "createLobby":
                this.handleCreateLobby(connection, (data as createLobbyMessage).userId)
                break;
            case "leaveLobby":
                this.handleLeaveLobby(connection)
                break;
            case "gameAction":
                if (player) {
                    this._handlers.handleGameAction(player, (data as GameActionMessage))
                }
                break;
            case "invite":
                this.handleInvite(connection, data.userId, data.targetUserId)
                break;
            case "acceptInvite":
                this.handleAcceptInvite(connection, data.userId, data.inviteId)
                break;
            case "declineInvite":
                this.handleDeclineInvite(connection, data.userId, data.inviteId)
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
            default:
                throw Error("WTF DUDE!!!");
        }
    }

    private handleInvite(connection: WebSocket, fromUserId?: number, toUserId?: number) {
        if (!fromUserId || !toUserId) {
            this.sendMessage(connection, {
                type: "error",
                message: "Not user to send from/to"
            })
            return;
        }

        const lobbyId = randomUUID();
        const lobby = this.createLobby(lobbyId);
        this._lobbies.set(lobbyId, lobby);

        const inviteId = randomUUID();

        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 5)

        this._invites.set(inviteId, {
            from: fromUserId,
            to: toUserId,
            lobbyId,
            expires
        })

        this.sendMessage(connection, {
            type: "inviteSent",
            inviteId,
            toUserId,
            lobbyId
        })

        this.NotifyUserOfInvite(toUserId, fromUserId, inviteId)
    }

    private async NotifyUserOfInvite(toUserId: number, fromUserId: number, inviteId: string) {
        for (const [conn, player] of this._clients.entries()) {
            if (player?.userId === toUserId) {
                const fromUser = await this._userService.findId(fromUserId);
                this.sendMessage(conn, {
                    type: "inviteReceived",
                    inviteId,
                    fromUserId,
                    fromUsername: fromUser?.username || "unknown user"
                })
                return;
            }
        }
    }

    private handleAcceptInvite(connection: WebSocket, userId?: number, inviteId?: string) {
        if (!userId || !inviteId) {
            this.sendMessage(connection, {
                type: "error",
                message: "user or invite not found"
            })
            return;
        }

        const invite = this._invites.get(inviteId)
        if (!invite || invite.to !== userId) {
            this.sendMessage(connection, {
                type: "error",
                message: "invite not found in list or not for user"
            })
            return;
        }

        const lobby = this._lobbies.get(invite.lobbyId)
        if (!lobby) {
            this.sendMessage(connection, {
                type: "error",
                message: "lobby not found"
            })
            return;
        }

        const player = lobby.addPlayer(connection, userId);
        if (player) {
            this._clients.set(connection, player);
        }

        this.sendMessage(connection, {
            type: "joinedLobby",
            lobbyId: invite.lobbyId,
            playerId: player?.id
        })

        this._invites.delete(inviteId);
    }

    private handleDeclineInvite(connection: WebSocket, userId?: number, inviteId?: string) {
        if (!userId || !inviteId) {
            return
        }
        const invite = this._invites.get(inviteId);
        if (!invite || invite.to !== userId)
            return

        this._invites.delete(inviteId)

        this.NotifyUserOfDeclinedInvite(invite.from, userId);

        const lobby = this._lobbies.get(invite.lobbyId)
        if (lobby && lobby.isEmpty()) {
            this._lobbies.delete(invite.lobbyId)
        }

        this.sendMessage(connection, {
            type: "inviteDeclined",
            inviteId
        })
    }

    private async NotifyUserOfDeclinedInvite(userId: number, declinedBy: number) {
        for (const [conn, player] of this._clients.entries()) {
            if (player?.userId === userId) {
                const decliningUser = await this._userService.findId(declinedBy);
                this.sendMessage(conn, {
                    type: "inviteDeclined",
                    byUserId: declinedBy,
                    declinedByUser: decliningUser?.username
                })
                return;
            }
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

    protected broadcast(lobbyId: string, data: ServerMessage): void {
        for (const [connection, player] of this._clients.entries()) {
            if (player?.lobbyId === lobbyId && connection.readyState === WebSocket.OPEN) {
                connection.send(JSON.stringify(data));
            }
        }
    }

    protected handleCreateLobby(connection: WebSocket, userId?: number) {
        const lobbyId = randomUUID();
        const lobby = this.createLobby(lobbyId);

        this._lobbies.set(lobbyId, lobby);

        const player = lobby.addPlayer(connection, userId);

        if (player) {
            this._clients.set(connection, player);
            //what does this frontend want to do with this message?
            this.sendMessage(connection, {
                type: "lobbyCreated",
                lobbyId: lobbyId,
                playerId: player.id
            })
        }
    }

    protected handleJoinLobby(connection: WebSocket, userId?: number, lobbyId?: string) {
        if (!lobbyId) {
            this.sendMessage(connection, {
                type: "error",
                message: "Lobby Id is required"
            })
            return;
        }

        const lobby = this._lobbies.get(lobbyId)

        if (!lobby) {
            this.sendMessage(connection, {
                type: "error",
                message: "Lobby no idea"
            })
            return;
        }

        const player = lobby.addPlayer(connection, userId)

        if (player) {
            this._clients.set(connection, player)
        }

        this.sendMessage(connection, {
            type: "joinedLobby",
            lobbyId: lobbyId,
            playerId: player?.id
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

    private handlePlayerReady(connection: WebSocket, player: Player, isReady: boolean) {
        if (!player || !player.lobbyId) {
            this.sendMessage(connection, {
                type: "error",
                message: "not in a lobby"
            })
            return
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
        if (!player || !player.lobbyId) { return; }

        const lobby = this._lobbies.get(player.lobbyId) as MatchLobby
        if (lobby && lobby.getCreatorId() === player.userId) {
            lobby.resumeGame();
        } else {
            this.sendMessage(connection, {
                type: "error",
                message: "Only lobby creator can resume game"
            })
        }
    }

    private async handleGetLobbyList(connection: WebSocket) {
        const openLobbies = await this._matchService.getOpenLobbies();

        const dbLobbies = openLobbies.map( Lobby => {
            const activeLobby = Array.from(this._lobbies.values()).find(l =>
                l.getGameId() === Lobby.id
            );

            if (activeLobby)
            {
                return activeLobby.getLobbyInfo();
            }

            return {
                id: Lobby.id.toString(),
                name: Lobby.lobbyName || `Lobby ${Lobby.id}`,
                creatorId: Lobby.player1.id,
                maxPlayers: Lobby.maxPlayers || 2,
                currentPlayers: Lobby.lobbyParticipants?.length || 1,
                isPublic: !Lobby.hasPassword,
                hasPassword: Lobby.hasPassword || false,
                createdAt: Lobby.createdAt,
                lobbyType: 'game' as const,
                isStarted: false
            }
        })

        const allLobbies = [...dbLobbies]
        for (const [id, lobby] of this._lobbies.entries())
        {
            allLobbies.push(lobby.getLobbyInfo());
        }

        this.sendMessage(connection, {
            type: "lobbyList",
            lobbies: allLobbies
        })
    }

    protected createLobby(lobbyId: string): MatchLobby {
        return new MatchLobby(
            lobbyId,
            this.broadcast.bind(this),
            this._matchService
        )
    }
}
