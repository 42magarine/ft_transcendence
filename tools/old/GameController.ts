
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

    public getGameState(): object {
        return this.game.getBoard();
    }

    public makeMove(index: number): object {
        return this.game.makeMove(index);
    }

    public resetGame(): object {
        return this.game.resetGame();
    }
}
