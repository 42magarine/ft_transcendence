import { WebSocket } from "ws";
import { PongGame } from "../models/Pong.js";
import { Player } from "../models/Player.js";
import { MessageHandlers } from "../services/MessageHandlers.js";
import { ClientMessage, ServerMessage } from "../../types/ft_types.js";
import { IGameState, LobbyInfo } from "../../types/interfaces.js";
import { GameLobby } from "../models/GameLobby.js";
import { GameRepository, GameService } from "../services/GameService.js";
import { UserService } from "../services/UserService.js";
import { connect } from "http2";
import { FastifyReply, FastifyRequest } from "fastify";
import user from "../../routes/user.js";
import { randomUUID } from "crypto";

export class PongController {
    private _lobbies: Map<string,GameLobby>; //pong game lobby for inviting players
    private _clients: Map<WebSocket, Player | null>; //
    private _handlers: MessageHandlers;
    private _gameService: GameService;

    constructor() {
        this._gameService = new GameService(new GameRepository(), new UserService());
        this._lobbies = new Map<string, GameLobby>();
        this._clients = new Map<WebSocket, Player | null>;
        this._handlers = new MessageHandlers(this.broadcast.bind(this));
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



    // wichtig fuer frontend um die richtigen aktionen aufzurufen!
    private handleMessage(message: string | Buffer, connection: WebSocket): void {
        let data: ClientMessage;
        try {
            data = JSON.parse(message.toString()) as ClientMessage;
        } catch (error: unknown) {
            console.error("Invalid message format", error);
            return;
        }

        const player = this._clients.get(connection);

        switch (data.type) {

            case "joinLobby":
                this.handleJoinLobby(connection, data.userId, data.lobbyId)
                break;
            case "createLobby":
                this.handleCreateLobby(connection, data.userId)
                break;
            case "leaveLobby":
                this.handleLeaveLobby(connection)
                break;
            case "gameAction":
                if (player) {
                    this._handlers.handleGameAction(player, data)
                }
                break;
            default:
                console.warn("Unknown message", data.type)

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

                if (lobby.isEmpty())
                {
                    this._lobbies.delete(player.lobbyId);
                }
            }
        }
        this._clients.delete(connection);
    }

    private broadcast(lobbyId: string, data: ServerMessage): void {
        for (const [connection, player] of this._clients.entries()) {
            if (player?.lobbyId === lobbyId && connection.readyState === WebSocket.OPEN) {
                connection.send(JSON.stringify(data));
            }
        }
    }

    //Websocket functions
    private handleCreateLobby(connection: WebSocket, userId?: number)
    {
        const lobbyId = randomUUID();
        const lobby = new GameLobby(lobbyId, this.broadcast.bind(this), this._gameService)

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

    private handleJoinLobby(connection: WebSocket, userId?: number, lobbyId?: string)
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

    private handleLeaveLobby(connection: WebSocket)
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

    //HTTP Endpoint functions
    public async getLobbies(request: FastifyRequest, reply: FastifyReply)
    {
        const lobbies: LobbyInfo[] = [];

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

    public async createLobby(request: FastifyRequest, reply: FastifyReply)
    {
        const userId = request.user?.id;

        if (!userId)
            return reply.code(400).send("User ID invalid");

        const lobbyId = randomUUID();

        const lobby = new GameLobby(
            lobbyId,
            this.broadcast.bind(this),
            this._gameService
        )

        this._lobbies.set(lobbyId, lobby);

        reply.code(200).send({lobbyId: lobbyId, message: "Lobby created"})
    }

    public async joinLobby(request: FastifyRequest <{Params: { id: string}}>, reply: FastifyReply): Promise<void>
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

    public async getGamebyId(request: FastifyRequest<{Params: {id: string} }>, reply: FastifyReply)
    {
        const {id} = request.params
        const userId = request.user?.id;

        if (!userId){
            return reply.code(400).send({error: "invalid user"})
        }

        try {
            const gameId = parseInt(id, 10)

            if (isNaN(gameId)) {
                return reply.code(400).send({error: "invalid game id"});

            }
        }
        catch (error)
        {
            console.error("oopsie")
        }
    }
}
