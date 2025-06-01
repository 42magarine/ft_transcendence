import { FastifyInstance } from "fastify";
import { MatchController } from "../backend/controllers/MatchController.js";
import { MatchService } from "../backend/services/MatchService.js";
import { UserService } from "../backend/services/UserService.js";

export default async function (fastify: FastifyInstance) {
    const userService = new UserService();
    const matchService = new MatchService(userService);
    const matchController = new MatchController(matchService);

    // Websocket route handler
    fastify.get('/api/game/wss', { websocket: true }, (connection, _request) => {
        matchController.handleConnection(connection);
    });
}
