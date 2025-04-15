import { PongController } from "../backend/controllers/PongController.js";
export default async function (fastify) {
    const pongController = new PongController();
    // Websocket route handler
    fastify.get('/ws', { websocket: true }, (connection) => {
        pongController.handleConnection(connection);
    });
}
