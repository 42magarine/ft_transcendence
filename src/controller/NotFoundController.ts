import { FastifyRequest, FastifyReply } from "fastify";

export class NotFoundController {

	static async notFound(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		reply.code(404);
		return reply.sendFile("views/404.html");
	}

}