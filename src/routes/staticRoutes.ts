import { FastifyInstance } from "fastify";
import staticController from "../controllers/staticController.js";

export default async function staticRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get("/", staticController.serveIndex);
    fastify.get("/hello", staticController.serveHello);
}
