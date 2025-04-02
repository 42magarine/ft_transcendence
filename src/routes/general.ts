import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { GeneralController } from "../controller/GeneralController.js";

export default async function generalRoutes(fastify: FastifyInstance): Promise<void> {

	fastify.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
		return GeneralController.getHome(req, reply);
	});

	fastify.get("/hello", async (req: FastifyRequest, reply: FastifyReply) => {
		return GeneralController.getHello(req, reply);
	});

}