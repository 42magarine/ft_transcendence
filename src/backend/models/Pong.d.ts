import { Ball } from "./Ball.js";
import { Paddle } from "./Paddle.js";
import { Player } from "./Player.js";
import { IGameState } from "../../types/interfaces.js";
export declare class PongGame {
    private width;
    private height;
    private ball;
    private paddle1;
    private paddle2;
    private score1;
    private score2;
    private isRunning;
    private paused;
    constructor(width: number, height: number);
    resetGame(): void;
    resetScores(): void;
    pauseGame(): void;
    resumeGame(): void;
    startGame(): void;
    isPaused(): boolean;
    update(): void;
    isColliding(ball: Ball, paddle: Paddle): boolean;
    movePaddle(player: Player, direction: "up" | "down"): void;
    getState(): IGameState;
}
