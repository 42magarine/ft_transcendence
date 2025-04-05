import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { SocketController } from "../controller/SocketController.js";

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
	const socketController = SocketController.getInstance();
	socketController.setFastify(fastify);

	// WebSocket route
	fastify.get("/ws", { websocket: true }, (connection) => {
		// Wrap the WebSocket connection in an object with a socket property
		socketController.setupWebSocket({ socket: connection });
	});
}