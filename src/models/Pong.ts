import { Ball } from "./Ball.js";
import { Paddle } from "./Paddle.js";
import { Player } from "./Player.js";
import { IGameState } from "../types/interfaces.js";
import { GAME_WIDTH, GAME_HEIGHT, STEPS } from "../types/constants.js"

export class PongGame {
    private ball: Ball;
    private paddle1: Paddle;
    private paddle2: Paddle;
    private score1: number = 0;
    private score2: number = 0;
    private paused: boolean = false;
    private width: number;
    private height: number;

    constructor() {
        this.width = GAME_WIDTH;
        this.height = GAME_HEIGHT;
        this.ball = new Ball(this.width / 2, this.height / 2, 4, 4);
        this.paddle1 = new Paddle(10, this.height / 2 - 50);
        this.paddle2 = new Paddle(this.width - 20, this.height / 2 - 50);
    }

    public resetGame(): void {
        this.ball = new Ball(this.width / 2, this.height / 2, 4, 4);
        this.ball.randomizeDirection();
        this.paddle1 = new Paddle(10, this.height / 2 - 50);
        this.paddle2 = new Paddle(this.width - 20, this.height / 2 - 50);
    }

    public resetScores(): void {
        this.score1 = 0;
        this.score2 = 0;
    }

    public pauseGame(): void {
        this.paused = true;
    }

    public resumeGame(): void {
        this.paused = false;
    }

    public isPaused(): boolean {
        return this.paused;
    }

    public update(): void {
        if (this.paused) {
            return;
        }

        for (let i = 0; i < STEPS; i++) {
            this.ball.updateBall();

            const ballY = this.ball.getY();
            const ballX = this.ball.getX();

            if (ballY <= 0 || ballY >= this.height) {
                this.ball.revY();
            }

            if (this.isColliding(this.ball, this.paddle1)) {
                const paddleCenterY = this.paddle1.getY() + this.paddle1.getHeight() / 2;
                const overlapY = ballY - paddleCenterY;
                this.ball.revX();
                this.ball.setSpeedY(this.ball.getSpeedY() + overlapY * 0.05);
            } else if (this.isColliding(this.ball, this.paddle2)) {
                const paddleCenterY = this.paddle2.getY() + this.paddle2.getHeight() / 2;
                const overlapY = ballY - paddleCenterY;
                this.ball.revX();
                this.ball.setSpeedY(this.ball.getSpeedY() + overlapY * 0.05);
            }

            if (ballX < 0) {
                this.incrementScore2();
                this.resetGame();
                break;
            } else if (ballX > this.width) {
                this.incrementScore1();
                this.resetGame();
                break;
            }
        }
    }



    private isColliding(ball: Ball, paddle: Paddle): boolean {
        return (
            ball.getX() - ball.getRadius() <= paddle.getX() + paddle.getWidth() &&
            ball.getX() + ball.getRadius() >= paddle.getX() &&
            ball.getY() + ball.getRadius() >= paddle.getY() &&
            ball.getY() - ball.getRadius() <= paddle.getY() + paddle.getHeight()
        );
    }



    public movePaddle(player: Player, direction: "up" | "down"): void {
        const paddle = player.id === 1 ? this.paddle1 : this.paddle2;

        if (direction === "up" && paddle.getY() > 0) {
            paddle.moveUp();
        } else if (direction === "down" && paddle.getY() + paddle.getHeight() < this.height) {
            paddle.moveDown();
        }
    }

    //getters

    public getState(): IGameState {
        return {
            ball: {
                x: this.ball.getX(),
                y: this.ball.getY(),
                radius: this.ball.getRadius()
            },
            paddle1: {
                x: this.paddle1.getX(),
                y: this.paddle1.getY(),
                width: this.paddle1.getWidth(),
                height: this.paddle1.getHeight()
            },
            paddle2: {
                x: this.paddle2.getX(),
                y: this.paddle2.getY(),
                width: this.paddle2.getWidth(),
                height: this.paddle2.getHeight()
            },
            score1: this.getScore1(),
            score2: this.getScore2(),
            paused: this.isPaused()
        };
    }

    public getScore1(): number {
        return this.score1;
    }

    public getScore2(): number {
        return this.score2;
    }

    //setters

    public setScore1(score: number): void {
        this.score1 = score;
    }

    public setScore2(score: number): void {
        this.score2 = score;
    }

    public incrementScore1(): void {
        this.score1++;
    }

    public incrementScore2(): void {
        this.score2++;
    }
}

