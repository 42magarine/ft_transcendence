import { FastifyInstance } from "fastify";
import { GameController } from "../controllers/GameController.js";

export default async function (fastify: FastifyInstance) {
    const gameController = GameController.getInstance();

    fastify.get("/game/state", async (_request, _reply) => {
        return gameController.getGameState();
    });

    fastify.post("/game/move", async (request, _reply) => {
        const { index } = request.body as { index: number };
        return gameController.makeMove(index);
    });

    fastify.post("/game/reset", async (_request, _reply) => {
        return gameController.resetGame();
    });
}
