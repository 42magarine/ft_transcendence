import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { MatchController } from "../backend/controllers/MatchController.js";
import { UserService } from "../backend/services/UserService.js";
import { MatchLobby } from "../backend/lobbies/MatchLobby.js";

export default async function (fastify: FastifyInstance) {
    const userService = new UserService();
    const _lobbies = new Map<string, MatchLobby>;
    const matchController = new MatchController(userService, _lobbies);

    // Websocket route handler
    fastify.get('/api/game/wss', { websocket: true }, (connection, request) => {
        const userId = request.user?.id;
        matchController.handleConnection(connection, userId);
    });
}
