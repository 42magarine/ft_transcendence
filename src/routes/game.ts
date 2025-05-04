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

	// fastify.route({
	// 	method: 'GET',
	// 	url: '/game/lobbies',
	// 	preHandler: authenticate,
	// 	handler: pongController.getLobbies.bind(pongController)
	// })

	// fastify.route({
	// 	method: 'POST',
	// 	url: '/game/lobbies/create',
	// 	preHandler: authenticate,
	// 	handler: pongController.createLobbyHttp.bind(pongController)
	// });

	// fastify.route({
	// 	method: 'POST',
	// 	url: '/game/lobbies/:id/join',
	// 	preHandler: authenticate,
	// 	handler: (request, reply) => {
	// 		const typedRequest = request as FastifyRequest<{Params: {id: string}}>
	// 		return pongController.joinLobbyHttp(typedRequest, reply);
	// 	}
	// })
}
