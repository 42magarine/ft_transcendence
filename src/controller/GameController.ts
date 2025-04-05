import { TicTacToe } from "../models/TicTacToe.js";
import { Player } from "../models/Player.js";

export class GameController {
	private static instance: GameController;
	private game: TicTacToe;

	private constructor() {
		this.game = new TicTacToe();
	}

	public static getInstance(): GameController {
		if (!GameController.instance) {
			GameController.instance = new GameController();
		}
		return GameController.instance;
	}

	public getGameState(): { board: Player[], player: Player } {
		return {
			board: this.game.getBoard(),
			player: this.game.getCurrentPlayer()
		};
	}

	public initGame(): object {
		return {
			type: "initBoard",
			board: this.game.getBoard(),
			player: this.game.getCurrentPlayer()
		};
	}

	public makeMove(index: number): object {
		return this.game.makeMove(index);
	}

	public resetGame(): object {
		return this.game.resetGame();
	}
}