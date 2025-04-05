// routes/api.ts
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { GameController } from "../controller/GameController.js";

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
	const gameController = GameController.getInstance();

	// Game state
	fastify.get("/game/state", async (request, reply) => {
		return gameController.getGameState();
	});

	// Make move
	fastify.post("/game/move", async (request, reply) => {
		const { index } = request.body as { index: number };
		return gameController.makeMove(index);
	});

	// Reset game
	fastify.post("/game/reset", async (request, reply) => {
		return gameController.resetGame();
	});
}