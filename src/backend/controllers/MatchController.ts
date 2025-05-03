import { randomUUID } from "crypto";
import { ClientMessage, createLobbyMessage, GameActionMessage, joinLobbyMessage, ServerMessage } from "../../types/interfaces.js";
import { GameLobby } from "../lobbies/GameLobby.js";
import { Player } from "../gamelogic/components/Player.js";
import { MessageHandlers } from "../services/MessageHandlers.js";
import { UserService } from "../services/UserService.js";
import { WebSocket } from "ws";
import { FastifyReply, FastifyRequest } from "fastify";
import { MatchLobby } from "../lobbies/MatchLobby.js";

export abstract class MatchController {

    protected _lobbies: Map<string, MatchLobby>;
    protected _clients: Map<WebSocket, Player | null>; //
    protected _handlers: MessageHandlers;
    protected _userService: UserService;
    protected _invites: Map<string, { from: number, to: number, lobbyId:string, expires: Date}>

    constructor(userService: UserService, lobbies: Map<string,MatchLobby>) {
        this._userService = userService;
        this._lobbies = lobbies;
        this._clients = new Map<WebSocket, Player | null>;
        this._handlers = new MessageHandlers(this.broadcast.bind(this));
        this._invites = new Map<string, { from: number, to: number, lobbyId:string, expires: Date}>()

        setInterval(() => {
            this.cleanUpInvites(), 60000
        })
    }

    private async cleanUpInvites()
    {
        const now = new Date();

        for (const [inviteId, invite] of this._invites.entries())
        {
            if (invite.expires < now)
            {
                this._invites.delete(inviteId);
            }

            const lobby = this._lobbies.get(invite.lobbyId)
            if(lobby && lobby.isEmpty())
            {
                this._lobbies.delete(invite.lobbyId);
            }
        }
    }

    public handleConnection = (connection: WebSocket, userId?: number): void => {
        console.log("A new client connected!");
        this._clients.set(connection, null);

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

    protected handleMessage(message: string | Buffer, connection: WebSocket): void {
        let data: ClientMessage;
        try {
            data = JSON.parse(message.toString()) as ClientMessage;
        } catch (error: unknown) {
            console.error("Invalid message format", error)
            return;
        }

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
            default:
                this.handleSpecificMessage(data, connection, player!);
        }
    }

    protected handleSpecificMessage(data: ClientMessage, connection: WebSocket, player: Player | null): void
    {
        switch(data.type)
        {
            case "invite":
                this.handleInvite(connection, data.userId, data.targetUserId)
                break;

            case "acceptInvite":
                this.handleAcceptInvite(connection, data.userId, data.inviteId)
                break;

            case "declineInvite":
                this.handleDeclineInvite(connection, data.userId, data.inviteId)
                break;
        }
    }

    private handleInvite(connection: WebSocket, fromUserId?: number, toUserId?: number)
    {

    }

    private NotifyUserOfInvite()
    {

    }

    private handleAcceptInvite(connection: WebSocket, userId?: number, inviteId?: string)
    {

    }

    private handleDeclineInvite(connection: WebSocket, userId?: number, inviteId?: string)
    {

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

                if (lobby.isEmpty())
                {
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

    protected handleCreateLobby(connection: WebSocket, userId?: number)
    {
        const lobbyId = randomUUID();
        const lobby = this.createLobby(lobbyId);

        this._lobbies.set(lobbyId, lobby);

        const player = lobby.addPlayer(connection, userId);

        if (player) {
            this._clients.set(connection, player);

            this.sendMessage(connection, {
                type: "lobbyCreated",
                lobbyId: lobbyId,
                playerId: player.id
            })

        }
    }

    protected abstract createLobby(lobbyId: string): GameLobby //| TournamentLobby

    protected handleJoinLobby(connection: WebSocket, userId?: number, lobbyId?: string)
    {
        if (!lobbyId)
        {
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
            return
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


        //automatically start game -> change later
        if (lobby.isFull()) {
            lobby.startGame();
        }
        else
        {
            this.sendMessage(connection, {
                type: "error",
                message: "fail to join lobby"
            })
        }
    }

    protected handleLeaveLobby(connection: WebSocket)
    {
        const player = this._clients.get(connection);

        if (player && player.lobbyId) {
            const lobby = this._lobbies.get(player.lobbyId);

            if (lobby)
                lobby.removePlayer(player);

            if (lobby?.isEmpty())
            {
                this._lobbies.delete(player.lobbyId)
            }
        }

        this._clients.set(connection, null)

        this.sendMessage(connection, {
            type: "leftLobby"
        })
    }

    public async getLobbies(request: FastifyRequest, reply: FastifyReply)
    {
        const lobbies = [];

        for (const [id, lobby] of this._lobbies.entries()) {
            if (!lobby.isFull() && !lobby.isGameStarted()) {
                lobbies.push({
                    id: id,
                    players: lobby.getPlayerCount(),
                    maxPlayers: 2,
                    creator: lobby.getCreatorId() || "Unknown"
                })
            }
        }
        reply.code(200).send({lobbies});
    }

    public async createLobbyHttp(request: FastifyRequest, reply: FastifyReply)
    {
        const userId = request.user?.id;

        if (!userId)
            return reply.code(400).send("User ID invalid");

        const lobbyId = randomUUID();

        const lobby = this.createLobby(lobbyId)

        this._lobbies.set(lobbyId, lobby);

        reply.code(200).send({lobbyId: lobbyId, message: "Lobby created"})
    }

    public async joinLobbyHttp(request: FastifyRequest <{Params: { id: string}}>, reply: FastifyReply): Promise<void>
    {
        const  {id} = request.params;
        const userId = request.user?.id;

        if (!userId) {
            return reply.code(400).send({error: "User not found"})
        }

        const lobby = this._lobbies.get(id);

        if (!lobby)
        {
            return reply.code(404).send({error: "Lobby not found"})
        }

        if (lobby.isFull())
        {
            return reply.code(400).send({error: "Lobby full"})
        }

        reply.code(200).send({lobbyId: id, message: "use Websocket connection to join lobby"})
    }
}