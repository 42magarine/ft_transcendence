import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PongController } from "../backend/controllers/PongController.js";
import { UserController } from "../backend/controllers/UserController.js";
import { UserService } from "../backend/services/UserService.js";
import fastifyStatic from "@fastify/static";
import { authenticate, verifyJWT } from "../backend/middleware/security.js";
import { error } from "console";

export default async function (fastify: FastifyInstance) {
    const pongController = new PongController();

    // Websocket route handler
    fastify.get('/game/ws', { websocket: true }, (connection, request) => {
		const userId = request.user?.id;
        pongController.handleConnection(connection, userId);
    });

	fastify.route({
		method: 'GET',
		url: '/game/lobbies',
		preHandler: authenticate,
		handler: pongController.getPublicLobbies.bind(pongController)
	})

fastify.get('/game/:id', {
	onRequest: authenticate,
	schema: {
		params: {
			type: 'object',
			properties: {
				id: {type: 'string'}
			},
			required: ['id']
		}
	}
}, async (request,reply) => {
	return pongController.getGameById(request, reply);
})



}
