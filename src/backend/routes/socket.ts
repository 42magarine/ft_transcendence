import { FastifyInstance } from "fastify";
import { SocketController } from "../controller/SocketController.js";

export default async function socketRoutes(fastify: FastifyInstance): Promise<void> {
	const socketController = SocketController.getInstance();
	socketController.setFastify(fastify);

	fastify.get("/ws", { websocket: true }, (connection) => {
		socketController.setupWebSocket(connection);
	});
}