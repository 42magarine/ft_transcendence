import { FastifyRequest, FastifyReply } from "fastify";
import { GameController } from "./GameController.js";

export class GeneralController {
	static async getHome(req: FastifyRequest, reply: FastifyReply): Promise<void> {
		const gameController = GameController.getInstance();
		const gameState = gameController.getGameState();
		console.log("Game state:", gameState);

		return reply.view("game.ejs", {
			currentPlayer: gameState.player,
			board: gameState.board
		});
	}

	static async getHello(req: FastifyRequest, reply: FastifyReply): Promise<void> {
		console.log("GeneralController.getHello called");
		return reply.view("hello.ejs", {});
	}
}