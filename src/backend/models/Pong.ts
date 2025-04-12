import { Ball } from "./Ball.js";
import { Paddle } from "./Paddle.js";
import { Player } from "./Player.js";
import { IGameState } from "../../types/interfaces.js";

export class PongGame {
    private ball: Ball;
    private paddle1: Paddle;
    private paddle2: Paddle;
    private score1: number = 0;
    private score2: number = 0;
    private isRunning: boolean = false;         // <-  wird nie aufgerufen
    private paused: boolean = false;
    // sollten wir die vaiablen nicht besser explizit erklären?
    // private width: number;
    // private height: number;

    constructor(private width: number, private height: number) {
    // constructor(width: number, height: number) {
        // this.width = width;
        // this.height = height;
        this.ball = new Ball(this.width / 2, this.height / 2, 4, 4, 10);
        this.paddle1 = new Paddle(10, this.height / 2 - 50);
        this.paddle2 = new Paddle(this.width - 20, this.height / 2 - 50);
        // Sollten wir für die Ball Parameter constanten erstellen, damit man versteht was wir hier definieren?
    }

    resetGame(): void {
        this.ball = new Ball(this.width / 2, this.height / 2, 4, 4, 10);
        this.ball.randomizeDirection();
        this.paddle1 = new Paddle(10, this.height / 2 - 50);
        this.paddle2 = new Paddle(this.width - 20, this.height / 2 - 50);
    }

    resetScores(): void {
        this.score1 = 0;
        this.score2 = 0;
    }

    // machen die funktionen pauseGame, resumeGame, startGame und isPause nicht alle das gleiche? vielleicht 2 funktionen getGameStatus und setGameStatus?
    pauseGame(): void {
        this.paused = true;
    }

    resumeGame(): void {
        this.paused = false;
    }

    startGame(): void {         // <- wird nie aufgerufen
        this.isRunning = true;
    }

    public isPaused(): boolean {
        return this.paused;
    }

    update(): void {
        // move stepsize to ball class?
        const steps: number = 4;
        const stepSize = 1 / steps;
        // brauchen wir das wirklich? oder dafür eine constante erstellen? oder falls der Ball schneller werden soll mit der Zeit dann ein funktion?

        if (this.paused === true) {
            return;
        }

        for (let i = 0; i < steps; i++) {
            this.ball.updateBall(stepSize);     // <- wenn wir hier immer ein Parameter übergaben, brauchen wir dann in der updateBall Funktion eine default value?

            // Wall bounce
            if (this.ball.y <= 0 || this.ball.y >= this.height) {
                this.ball.revY();
            }

            // Paddle bounce
            if (this.isColliding(this.ball, this.paddle1)) {
                const overlapY: number = this.ball.y - (this.paddle1.y + this.paddle1.height / 2);
                this.ball.revX();
                this.ball.speedY += overlapY * 0.05;
            }
            else if (this.isColliding(this.ball, this.paddle2)) {
                const overlapY: number = this.ball.y - (this.paddle2.y + this.paddle2.height / 2);
                this.ball.revX();
                this.ball.speedY += overlapY * 0.05;
            }

            // Scoring
            if (this.ball.x < 0) {
                this.score2++;
                this.resetGame();
                break;
            }
            else if (this.ball.x > this.width) {
                this.score1++;
                this.resetGame();
                break;
            }
        }
    }

    isColliding(ball: Ball, paddle: Paddle): boolean {
        return (
            ball.x - ball.radius <= paddle.x + paddle.width &&
            ball.x + ball.radius >= paddle.x &&
            ball.y + ball.radius >= paddle.y &&
            ball.y - ball.radius <= paddle.y + paddle.height
        );
    }

    movePaddle(player: Player, direction: "up" | "down"): void {
        const paddle = player.id === 1 ? this.paddle1 : this.paddle2;
        if (direction === "up" && paddle.y > 0) {
            paddle.moveUp();
        }
        else if (direction === "down" && paddle.y + paddle.height < this.height) {
            paddle.moveDown();
        }
    }

    getState(): IGameState {
        return {
            ball: {
                x: this.ball.x,
                y: this.ball.y,
                radius: this.ball.radius
            },
            paddle1: {
                x: this.paddle1.x,
                y: this.paddle1.y,
                width: this.paddle1.width,
                height: this.paddle1.height
            },
            paddle2: {
                x: this.paddle2.x,
                y: this.paddle2.y,
                width: this.paddle2.width,
                height: this.paddle2.height
            },
            score1: this.score1,
            score2: this.score2,
            paused: this.paused
        };
    }
}

// funktionen sollten als private oder public definiert werden?
