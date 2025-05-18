import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PongController } from "../backend/controllers/PongController.js";
import fastifyStatic from "@fastify/static";
import { authenticate, verifyJWT } from "../backend/middleware/security.js";

export default async function (fastify: FastifyInstance) {
	const pongController = new PongController();

	// Websocket route handler
	fastify.get('/game/wss', { websocket: true }, (connection, request) => {
		const userId = request.user?.id;
		pongController.handleConnection(connection, userId);
	});

	//get your game history <-- maybe move to user instead
	fastify.get('/game/history', {
		onRequest: authenticate,
	},
		async (request, reply) => {
			return pongController.getUserGames(request, reply)
		})
}
