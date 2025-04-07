import { FastifyInstance } from "fastify";
import { WebsocketController } from "../controllers/WebsocketController.js";

export default async function (fastify: FastifyInstance) {
    const websocketController = new WebsocketController();

    // Websocket route handler
    fastify.get('/ws', { websocket: true }, (connection) => {
        websocketController.handleConnection(connection);
    });
}
