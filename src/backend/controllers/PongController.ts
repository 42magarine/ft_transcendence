import { WebSocket } from "ws";
import { ClientMessage, ReadyMessage, ServerMessage } from "../../types/interfaces.js";
import { GameLobby } from "../lobbies/GameLobby.js";
import { GameService } from "../services/GameService.js";
import { UserService } from "../services/UserService.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { MatchController } from "./MatchController.js";
import { Player } from "../gamelogic/components/Player.js";
import { WebsocketHandler } from "@fastify/websocket";

export class PongController extends MatchController {
    private _gameService: GameService;

    constructor() {
        const userService = new UserService()
        const gameService = new GameService(userService);
        const lobbies = new Map<string, GameLobby>();
        super(userService, lobbies);
        this._gameService = gameService;
    }

    protected handleSpecificMessage(data: ClientMessage, connection: WebSocket, player: Player): void {
        switch(data.type)
        {
            case "ready":
                this.handlePlayerReady(connection, player, (data as ReadyMessage).ready)
                break;

            case "startGame":
                this.handleStartGame(connection, player);
                break;
            case "pauseGame":
                this.handlePauseGame(connection, player);
                break;
            case "resumeGame":
                this.handleResumeGame(connection, player)
                break;
            case "getLobbyList":
                this.handleGetLobbyList(connection);
                break;
        }
    }

    private handlePlayerReady(connection: WebSocket, player: Player, isReady: boolean)
    {
        if (!player || !player.lobbyId)
        {
            this.sendMessage(connection, {
                type: "error",
                message: "not in a lobby"
            })
            return
        }

        const lobby = this._lobbies.get(player.lobbyId) as GameLobby
        if(!lobby){
            this.sendMessage(connection, {
                type: "error",
                message: "Lobby not found"
            })
            return;
        }
        lobby.setPlayerReady(player.id, isReady)
    }

    private handleStartGame(connection: WebSocket, player: Player)
    {
        if(!player || !player.lobbyId) {
            this.sendMessage(connection, {
                type: "error",
                message: "not in lobby"
            })
            return;
        }

        const lobby = this._lobbies.get(player.lobbyId) as GameLobby;
        if (!lobby) {
            this.sendMessage(connection, {
                type: "error",
                message: "lobby not found"
            })
            return;
        }

        if (lobby.getCreatorId() !== player.userId)
        {
            this.sendMessage(connection, {
                type: "error",
                message: "Only creator can start game"
            })
            return;
        }

        if (lobby.getPlayerCount() < 2)
        {
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

    private handlePauseGame(connection: WebSocket, player: Player)
    {
        if (!player || !player.lobbyId)
        {   return;}

        const lobby = this._lobbies.get(player.lobbyId) as GameLobby
        if (lobby && lobby.getCreatorId() === player.userId) {
            lobby.pauseGame();
        } else {
            this.sendMessage(connection, {
                type: "error",
                message: "Only lobby creator can pause game"
            })
        }
    }


    private handleResumeGame(connection: WebSocket, player: Player)
    {
        if (!player || !player.lobbyId)
        {return;}

        const lobby = this._lobbies.get(player.lobbyId) as GameLobby
        if (lobby && lobby.getCreatorId() === player.userId) {
            lobby.resumeGame();
        } else {
            this.sendMessage(connection, {
                type: "error",
                message: "Only lobby creator can resume game"
            })
        }
    }


    //maybe need to modify to check if lobby is public in if condition
    private handleGetLobbyList(connection: WebSocket)
    {
        const publicLobbies = []

        for (const [id, lobby] of this._lobbies.entries()){
            if (!lobby.isFull && !lobby.isGameStarted())
            {
                publicLobbies.push(lobby.getLobbyInfo())
            }
        }

        this.sendMessage(connection, {
            type: "lobbyList",
            lobbies: publicLobbies
        })
    }

    protected createLobby(lobbyId: string): GameLobby {
        return new GameLobby(
            lobbyId,
            this.broadcast.bind(this),
            this._gameService
        )
    }

    public async getGameById(request: FastifyRequest<{Params: {id: string} }>, reply: FastifyReply)
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

            const gameState = this._gameService.getGameStateById(gameId, userId)

            if (!gameState)
                return reply.code(404).send({error: "Couldnt find this game"})

            return reply.code(200).send(gameState);
        }
        catch (error)
        {
            console.error("oopsie")
        }
    }

    public async getUserGames(request: FastifyRequest, reply: FastifyReply)
    {
        const userId = request.user?.id;

        if (!userId)
            return reply.code(400).send({error: "Invalid user"})

            const games = await this._gameService.findGameByPlayerId(userId);

            const gameHistories = await Promise.all(games.map(async (game) =>
                {return await this._gameService.getGameStateById(game.id, userId)}))

            return reply.code(200).send({ game: gameHistories.filter(game => game !== null)})
    }

    public async getPublicLobbies(request: FastifyRequest, reply: FastifyReply) {
        const lobbies = []

        for (const [id, lobby] of this._lobbies.entries()) {
            if (!lobby.isFull() && !lobby.isGameStarted() && lobby.getLobbyInfo().isPublic)
                lobbies.push(lobby.getLobbyInfo());
        }

    return reply.code(200).send({lobbies});
    }
}
