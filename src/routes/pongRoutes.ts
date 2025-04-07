import { FastifyInstance } from "fastify";
import PongWebsocketController from "../controllers/pongWebsocketController.js";

export default async function pongWebsocketRoutes(fastify: FastifyInstance) {
	const pongWebsocketController = new PongWebsocketController(fastify);
    fastify.get("/ws", { websocket: true }, pongWebsocketController.handleConnection);
}
