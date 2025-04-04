import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { NotFoundController } from "../controller/NotFoundController.js";

export default async function notFoundRoutes(fastify: FastifyInstance): Promise<void> {
	console.log("Registering 404 handler");

	// Make sure this is the last plugin registered
	fastify.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
		console.log(`404 handler called for: ${request.method} ${request.url}`);
		return NotFoundController.notFound(request, reply);
	});
}