// routes/api.ts
import { FastifyInstance } from "fastify";
import { GameController } from "../controller/GameController.js";

export default async function apiRoutes(fastify: FastifyInstance): Promise<void> {
	const gameController = GameController.getInstance();

	fastify.get("/game/state", async (request, reply) => {
		return gameController.getGameState();
	});

	fastify.post("/game/move", async (request, reply) => {
		const { index } = request.body as { index: number };
		return gameController.makeMove(index);
	});

	fastify.post("/game/reset", async (request, reply) => {
		return gameController.resetGame();
	});
}