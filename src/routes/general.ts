import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export default async function generalRoutes(fastify: FastifyInstance): Promise<void> {
	// Serve `index.html` at `/`
	fastify.get("/", async (_req: FastifyRequest, reply: FastifyReply) => {
		return reply.sendFile("views/index.html");
	});

	// Serve `hello.html` at `/hello`
	fastify.get("/hello", async (_req: FastifyRequest, reply: FastifyReply) => {
		return reply.sendFile("views/hello.html");
	});
}