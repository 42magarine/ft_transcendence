import { IBallState, IPaddleState } from "../../interfaces/interfaces.js";

export default class LocalGameLogic {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private ball!: IBallState;
    private paddle1!: IPaddleState;
    private paddle2!: IPaddleState;

    private winScore!: number;
    private score1: number = 0;
    private score2: number = 0;
    private gameOver: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
    }

    public initializeGame(settings: {
        winScore: number;
        ballSpeed: number;
        ballSize: number;
        paddleSpeed: number;
        paddleWidth: number;
        paddleHeight: number;
    }): void {
        this.winScore = settings.winScore;
        this.score1 = 0;
        this.score2 = 0;
        this.gameOver = false;

        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: settings.ballSize,
            speedX: settings.ballSpeed,
            speedY: settings.ballSpeed
        };

        // Initialize paddle 1 (left)
        this.paddle1 = {
            x: 20,
            y: (this.canvas.height - settings.paddleHeight) / 2,
            width: settings.paddleWidth,
            height: settings.paddleHeight,
            speed: settings.paddleSpeed
        };

        // Initialize paddle 2 (right)
        this.paddle2 = {
            x: this.canvas.width - 20 - settings.paddleWidth,
            y: (this.canvas.height - settings.paddleHeight) / 2,
            width: settings.paddleWidth,
            height: settings.paddleHeight,
            speed: settings.paddleSpeed
        };
    }

    public update(): void {
        if (this.gameOver) {
            return;
        }
        this.updateBall();
        this.checkCollisions();
        this.checkScoring();
    }

    private updateBall(): void {
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;
    }

    private checkCollisions(): void {
        // Ball collision with top/bottom walls
        if (this.ball.y - this.ball.radius <= 0) {
            this.ball.y = this.ball.radius;
            this.ball.speedY = Math.abs(this.ball.speedY);
        }
        if (this.ball.y + this.ball.radius >= this.canvas.height) {
            this.ball.y = this.canvas.height - this.ball.radius;
            this.ball.speedY = -Math.abs(this.ball.speedY);
        }

        // Ball collision with paddle 1 (left)
        if (this.ball.x - this.ball.radius <= this.paddle1.x + this.paddle1.width &&
            this.ball.x + this.ball.radius >= this.paddle1.x &&
            this.ball.y >= this.paddle1.y &&
            this.ball.y <= this.paddle1.y + this.paddle1.height &&
            this.ball.speedX < 0) {
            this.ball.speedX *= -1;
            this.ball.x = this.paddle1.x + this.paddle1.width + this.ball.radius;
        }

        // Ball collision with paddle 2 (right)
        if (this.ball.x + this.ball.radius >= this.paddle2.x &&
            this.ball.x - this.ball.radius <= this.paddle2.x + this.paddle2.width &&
            this.ball.y >= this.paddle2.y &&
            this.ball.y <= this.paddle2.y + this.paddle2.height &&
            this.ball.speedX > 0) {
            this.ball.speedX *= -1;
            this.ball.x = this.paddle2.x - this.ball.radius;
        }
    }

    private checkScoring(): void {
        // Score detection
        if (this.ball.x + this.ball.radius < 0) {
            this.score2++;
            this.resetBall();
        }
        else if (this.ball.x - this.ball.radius > this.canvas.width) {
            this.score1++;
            this.resetBall();
        }

        // Check for game over
        if (this.score1 >= this.winScore || this.score2 >= this.winScore) {
            this.gameOver = true;
        }
    }

    public draw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#FFFFFF";
        
        this.drawBall();
        this.drawPaddles();
        this.drawScores();
        this.drawCenterLine();

        if (this.gameOver) {
            const winner = this.score1 >= this.winScore ? "Player 1" : "Player 2";
            this.drawStatusText(`${winner} WINS!`, "#FF0000");
        }
    }

    private drawBall(): void {
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.closePath();
    }

    private drawPaddles(): void {
        this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
        this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);
    }

    private drawScores(): void {
        this.ctx.font = "32px Arial";
        this.ctx.textAlign = "left";
        this.ctx.fillText(`Player 1: ${this.score1}`, 50, 40);
        this.ctx.textAlign = "right";
        this.ctx.fillText(`Player 2: ${this.score2}`, this.canvas.width - 50, 40);
    }

    private drawCenterLine(): void {
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.strokeStyle = "#FFFFFF";
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    public drawStatusText(text: string, color: string = "#FFFF00"): void {
        this.ctx.save();
        this.ctx.font = "64px Arial";
        this.ctx.fillStyle = color;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.shadowColor = "#000000";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.restore();
    }

    private resetBall(): void {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;

        // Random direction for ball
        const direction = Math.random() > 0.5 ? 1 : -1;
        const speed = Math.sqrt(this.ball.speedX * this.ball.speedX + this.ball.speedY * this.ball.speedY);
        this.ball.speedX = speed * direction;
        this.ball.speedY = (Math.random() - 0.5) * speed;
    }

    public movePaddle(player: 1 | 2, direction: "up" | "down"): void {
        const paddle = player === 1 ? this.paddle1 : this.paddle2;
        const dy = direction === "up" ? -paddle.speed! : paddle.speed;

        const newY = paddle.y + dy!;
        if (newY >= 0 && newY + paddle.height <= this.canvas.height) {
            paddle.y = newY;
        }
    }

    public isGameOver(): boolean {
        return this.gameOver;
    }

    // Settings methods
    public setWinScore(score: number): void {
        this.winScore = score;
    }

    public setBallSize(size: number): void {
        this.ball.radius = size;
    }

    public setBallSpeed(speed: number): void {
        const currentSpeed = Math.sqrt(this.ball.speedX ** 2 + this.ball.speedY ** 2);
        if (currentSpeed > 0) {
            const ratio = speed / currentSpeed;
            this.ball.speedX *= ratio;
            this.ball.speedY *= ratio;
        }
        else {
            this.ball.speedX = speed;
            this.ball.speedY = speed;
        }
    }

    public setPaddleWidth(width: number): void {
        this.paddle1.width = width;
        this.paddle2.width = width;
        this.paddle2.x = this.canvas.width - 20 - width;
    }

    public setPaddleHeight(height: number): void {
        const paddle1CenterY = this.paddle1.y + this.paddle1.height / 2;
        const paddle2CenterY = this.paddle2.y + this.paddle2.height / 2;

        this.paddle1.height = height;
        this.paddle2.height = height;

        this.paddle1.y = Math.max(0, Math.min(
            this.canvas.height - height,
            paddle1CenterY - height / 2
        ));

        this.paddle2.y = Math.max(0, Math.min(
            this.canvas.height - height,
            paddle2CenterY - height / 2
        ));
    }

    public setPaddleSpeed(speed: number): void {
        this.paddle1.speed = speed;
        this.paddle2.speed = speed;
    }
}
