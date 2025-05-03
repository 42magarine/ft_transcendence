import { FastifyInstance } from "fastify";
import { authenticate } from "../backend/middleware/security.js";


export default async function (fastify: FastifyInstance) {
    const tournamentController = new TournamentController();

    fastify.get("/tournament/ws", {websocket: true}, (connection, request) =>
    {
        const userId = request.user?.id;
        tournamentController.handleConnection(connection, userId)
    })

    fastify.route({
        method: 'GET',
        url: '/tournament/lobbies',
        preHandler: authenticate,
        handler: tournamentController.getLobbies.bind(tournamentController)
    })

    fastify.route({
        method: 'POST',
        url: '/tournament/lobbies/create',
        preHandler: authenticate,
        handler: tournamentController.createLobby.bind(tournamentController)
    })

    fastify.route({
        method: 'POST',
        url: '/game/lobbies/:id/join',
        preHandler: authenticate,
        handler: (request, reply) => {
            const typedRequest = request as FastifyRequest<{Params: {id: string}}>
            return tournamentController.joinLobby(typedRequest, reply);
        }
    })
}