import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export default async function notFoundRoutes(fastify: FastifyInstance): Promise<void> {
	// Set up a catch-all route for 404 errors
	fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
		return reply.sendFile("/views/404.html");
	});
}