import { Ball } from "./Ball.js";
import { Paddle } from "./Paddle.js";
import { Player } from "./Player.js";
import { IGameState } from "../types/interfaces.js";
import { ServerMessage, PaddleDirection } from "../types/ft_types.js";
import { GAME_WIDTH, GAME_HEIGHT, STEPS } from "../types/constants.js";

export class PongGame {
    private _width: number;
    private _height: number;
    private _ball: Ball;
    private _paddle1: Paddle;
    private _paddle2: Paddle;
    private _score1: number = 0;
    private _score2: number = 0;
    private _player1: Player | null = null;
    private _player2: Player | null = null;
    private _paused: boolean = false;
    private _running: boolean = false;
    private _intervalId: NodeJS.Timeout | null = null;

    constructor() {
        this._width = GAME_WIDTH;
        this._height = GAME_HEIGHT;
        this._ball = new Ball(this._width / 2, this._height / 2, 4, 4);
        this._paddle1 = new Paddle(10, this._height / 2 - 50);
        this._paddle2 = new Paddle(this._width - 20, this._height / 2 - 50);
    }

    public startGameLoop(broadcast: (data: ServerMessage) => void): void {
        if (this._running) return;

        this._running = true;
        this._intervalId = setInterval(() => {
            if (this._paused) return;

            this.update();
            broadcast({
                type: "update",
                state: this.getState()
            });
        }, 1000 / 60);
    }

    public stopGameLoop(): void {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        this._running = false;
    }

    public resetGame(): void {
        this._ball = new Ball(this._width / 2, this._height / 2, 4, 4);
        this._ball.randomizeDirection();
        this._paddle1 = new Paddle(10, this._height / 2 - 50);
        this._paddle2 = new Paddle(this._width - 20, this._height / 2 - 50);
    }

    public resetScores(): void {
        this._score1 = 0;
        this._score2 = 0;
    }

    public pauseGame(): void {
        this._paused = true;
    }

    public resumeGame(): void {
        this._paused = false;
    }

    public update(): void {
        if (this._paused) return;

        for (let i = 0; i < STEPS; i++) {
            this._ball.update();

            const ballY = this._ball.y;
            const ballX = this._ball.x;

            if (ballY <= 0 || ballY >= this._height) {
                this._ball.revY();
            }

            if (this.isColliding(this._ball, this._paddle1)) {
                const paddleCenterY = this._paddle1.y + this._paddle1.height / 2;
                const overlapY = ballY - paddleCenterY;
                this._ball.revX();
                this._ball.speedY += overlapY * 0.05;
            } else if (this.isColliding(this._ball, this._paddle2)) {
                const paddleCenterY = this._paddle2.y + this._paddle2.height / 2;
                const overlapY = ballY - paddleCenterY;
                this._ball.revX();
                this._ball.speedY += overlapY * 0.05;
            }

            if (ballX < 0) {
                this._score2++;
                this.resetGame();
                break;
            } else if (ballX > this._width) {
                this._score1++;
                this.resetGame();
                break;
            }
        }
    }


    private isColliding(ball: Ball, paddle: Paddle): boolean {
        return (
            ball.x - ball.radius <= paddle.x + paddle.width &&
            ball.x + ball.radius >= paddle.x &&
            ball.y + ball.radius >= paddle.y &&
            ball.y - ball.radius <= paddle.y + paddle.height
        );
    }

    public movePaddle(player: Player, direction: PaddleDirection): void {
        const paddle = player.id === 1 ? this._paddle1 : this._paddle2;

        if (direction === "up" && paddle.y > 0) {
            paddle.moveUp();
        } else if (direction === "down" && paddle.y + paddle.height < this._height) {
            paddle.moveDown();
        }
    }

    public getState(): IGameState {
        return {
            ball: {
                x: this._ball.x,
                y: this._ball.y,
                radius: this._ball.radius
            },
            paddle1: {
                x: this._paddle1.x,
                y: this._paddle1.y,
                width: this._paddle1.width,
                height: this._paddle1.height
            },
            paddle2: {
                x: this._paddle2.x,
                y: this._paddle2.y,
                width: this._paddle2.width,
                height: this._paddle2.height
            },
            score1: this._score1,
            score2: this._score2,
            paused: this._paused,
            running: this._running
        };
    }

    // Getters/Setters
    public get score1(): number {
        return this._score1;
    }

    public get score2(): number {
        return this._score2;
    }

    public get isRunning(): boolean {
        return this._running;
    }

    public get isPaused(): boolean {
        return this._paused;
    }

    public set score1(score: number) {
        this._score1 = score;
    }

    public set score2(score: number) {
        this._score2 = score;
    }

    public set isRunning(state: boolean) {
        this._running = state;
    }

    public set isPaused(state: boolean) {
        this._paused = state;
    }

    // Score incrementers
    public incrementScore1(): void {
        this._score1++;
    }

    public incrementScore2(): void {
        this._score2++;
    }
}
