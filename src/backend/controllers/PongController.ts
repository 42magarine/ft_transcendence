import { WebSocket } from "ws";
import { ClientMessage, ServerMessage } from "../../types/interfaces.js";
import { GameLobby } from "../lobbies/GameLobby.js";
import { GameService } from "../services/GameService.js";
import { UserService } from "../services/UserService.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { MatchController } from "./MatchController.js";
import { Player } from "../gamelogic/components/Player.js";

export class PongController extends MatchController {
    private _gameService: GameService;

    constructor() {
        const userService = new UserService()
        const gameService = new GameService(userService);
        const lobbies = new Map<string, GameLobby>();
        super(userService, lobbies);
        this._gameService = gameService;
    }

    protected handleSpecificMessage(data: ClientMessage, connection: WebSocket, player: Player | null): void {
        switch(data.type)
        {
            case "pauseGame":
                if (player && player.lobbyId)
                {
                    const lobby = this._lobbies.get(player.lobbyId) as GameLobby;
                    if (lobby) {
                        lobby.stopGame();
                    }
                }
                break;

            case "resumeGame":
                if (player && player.lobbyId)
                {
                    const lobby = this._lobbies.get(player.lobbyId) as GameLobby;
                    if (lobby) {
                        lobby.startGame();
                    }
                }
                break;
        }
    }

    protected createLobby(lobbyId: string): GameLobby {
        return new GameLobby(
            lobbyId,
            this.broadcast.bind(this),
            this._gameService
        )
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
}
