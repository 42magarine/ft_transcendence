import type { IGameState, IBallState } from "../../interfaces/interfaces.js";

export class LocalGameLogic {
    public state: IGameState;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private winScore: number;
    private paddleSpeed: number;
    private countdownActive = false;

    constructor(canvas: HTMLCanvasElement, paddleSpeed = 5, winScore = 5) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.paddleSpeed = paddleSpeed;
        this.winScore = winScore;

        this.state = {
            ball: { x: 400, y: 300, radius: 10, speedX: 5, speedY: 5 },
            paddle1: { x: 20, y: 250, width: 20, height: 100 },
            paddle2: { x: 760, y: 250, width: 20, height: 100 },
            score1: 0,
            score2: 0,
            paused: true,
            running: false,
            gameIsOver: false
        };
    }

    // Countdown and Game Control

    public async startCountdown(callback: () => void = () => { }): Promise<void> {
        this.countdownActive = true;
        this.state.paused = true;

        const countdown = ["3", "2", "1", "Go!"];
        for (const text of countdown) {
            this.drawCountdownText(text);
            await new Promise(resolve => setTimeout(resolve, 700));
        }

        this.countdownActive = false;
        this.state.paused = false;
        callback();
    }

    private drawCountdownText(text: string): void {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Optionally show paddles
        const paddles = [this.state.paddle1, this.state.paddle2];
        paddles.forEach(p => {
            ctx.fillStyle = "#FF0000";
            ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.strokeStyle = "#00FF00";
            ctx.strokeRect(p.x, p.y, p.width, p.height);
        });

        ctx.font = "72px Arial";
        ctx.fillStyle = "#FFFF00";
        ctx.textAlign = "center";
        ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    }

    public setPaused(paused: boolean): void {
        this.state.paused = paused;
    }

    // Main Game Loop (Logic & Draw)

    public update(): void {
        if (this.state.paused || this.state.gameIsOver || this.countdownActive) return;

        const ball = this.state.ball;
        ball.x += ball.speedX;
        ball.y += ball.speedY;

        if (ball.y <= 0 || ball.y >= this.canvas.height) ball.speedY *= -1;

        const paddle1 = this.state.paddle1;
        const paddle2 = this.state.paddle2;

        if (ball.x <= paddle1.x + paddle1.width &&
            ball.y >= paddle1.y &&
            ball.y <= paddle1.y + paddle1.height) {
            ball.speedX *= -1;
        }
        else if (ball.x + ball.radius >= paddle2.x &&
            ball.y >= paddle2.y &&
            ball.y <= paddle2.y + paddle2.height) {
            ball.speedX *= -1;
        }

        if (ball.x < 0) {
            this.state.score2++;
            this.resetBall();
        }
        else if (ball.x > this.canvas.width) {
            this.state.score1++;
            this.resetBall();
        }

        if (this.state.score1 >= this.winScore || this.state.score2 >= this.winScore) {
            this.state.gameIsOver = true;
            this.state.paused = true;
        }
    }

    public draw(): void {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const ball = this.state.ball;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.closePath();

        const paddles = [this.state.paddle1, this.state.paddle2];
        paddles.forEach(p => {
            ctx.fillStyle = "#FF0000";
            ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.strokeStyle = "#00FF00";
            ctx.strokeRect(p.x, p.y, p.width, p.height);
        });

        ctx.font = "24px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`Player 1: ${this.state.score1}`, 50, 30);
        ctx.fillText(`Player 2: ${this.state.score2}`, this.canvas.width - 180, 30);

        if (this.state.paused && !this.state.gameIsOver && !this.countdownActive) {
            ctx.font = "48px Arial";
            ctx.fillStyle = "#FFFF00";
            ctx.textAlign = "center";
            ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
        }

        if (this.state.gameIsOver) {
            ctx.font = "48px Arial";
            ctx.fillStyle = "#FF0000";
            ctx.textAlign = "center";
            const winner = this.state.score1 > this.state.score2 ? "Player 1" : "Player 2";
            ctx.fillText(`${winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    // Ball Control

    public resetBall(): void {
        const ball = this.state.ball;
        ball.x = this.canvas.width / 2;
        ball.y = this.canvas.height / 2;
        ball.speedX *= -1;
        ball.speedY = 5;
    }

    public updateBallSpeed(speed: number): void {
        const directionX = Math.sign(this.state.ball.speedX) || 1;
        const directionY = Math.sign(this.state.ball.speedY) || 1;
        this.state.ball.speedX = speed * directionX;
        this.state.ball.speedY = speed * directionY;
    }

    public updateBallSize(size: number): void {
        this.state.ball.radius = size;
    }

    // Paddle Control

    public movePaddle(player: 1 | 2, direction: "up" | "down"): void {
        const paddle = player === 1 ? this.state.paddle1 : this.state.paddle2;
        const dy = direction === "up" ? -this.paddleSpeed : this.paddleSpeed;
        paddle.y += dy;
    }

    public updatePaddleSpeed(speed: number): void {
        this.paddleSpeed = speed;
    }

    public updatePaddleSize(height: number, width: number): void {
        this.state.paddle1.height = height;
        this.state.paddle1.width = width;
        this.state.paddle2.height = height;
        this.state.paddle2.width = width;
    }

    // Game Settings

    public updateWinScore(score: number): void {
        this.winScore = score;
    }
}

export default LocalGameLogic;
