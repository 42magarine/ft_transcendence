import { PaddleDirection, ServerMessage, ClientMessage } from "../../types/ft_types.js";
import { PongGame } from "../models/Pong.js";
import { Player } from "../models/Player.js";

export class MessageHandlers {
    constructor(
        private game: PongGame,
        private broadcast: (data: ServerMessage) => void
    ) {};

    public movePaddle = (player: Player, data: ClientMessage): void => {
        if (data.type === "movePaddle") {
            const direction: PaddleDirection = data.direction;
            if (direction !== "up" && direction !== "down") return;

            this.game.movePaddle(player, direction);
            this.broadcast({
                type: "update",
                state: this.game.getState()
            });
        }
    };

    public initGame = (): void => {
        if (this.game.isRunning) return;

        this.game.isRunning = true;
        this.game.resetGame();
        this.game.startGameLoop(this.broadcast);

        this.broadcast({
            type: "initGame",
            state: this.game.getState()
        });
    };

    public resetGame = (): void => {
        this.game.stopGameLoop();
        this.game.resetGame();
        this.game.resetScores();
        this.game.startGameLoop(this.broadcast);
        this.game.isRunning = true;

        this.broadcast({
            type: "resetGame",
            state: this.game.getState()
        });
    };

    public pauseGame = (): void => {
        this.game.pauseGame();
        this.game.isRunning = true;

        this.broadcast({
            type: "pauseGame",
            state: this.game.getState()
        });
    };

    public resumeGame = (): void => {
        this.game.resumeGame();
        if (this.game.isRunning === false) {
            this.game.startGameLoop(this.broadcast);
            this.game.isRunning = true;
        }

        this.broadcast({
            type: "resumeGame",
            state: this.game.getState()
        });
    };
}
