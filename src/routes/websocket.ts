import { FastifyInstance } from "fastify";
import WebsocketController from "../controllers/websocketController.js";

export default async function websocketRoutes(fastify: FastifyInstance) {
    const websocketController = new WebsocketController(fastify);
    fastify.get("/ws", { websocket: true }, websocketController.handleConnection);
}
