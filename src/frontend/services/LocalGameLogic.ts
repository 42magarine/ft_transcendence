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

    private backgroundImages: HTMLImageElement[] = [];
    private currentBackgroundIndex: number = 0;

    // Base dimensions for scaling (original 800x600)
    private readonly BASE_WIDTH = 800;
    private readonly BASE_HEIGHT = 600;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.loadBackgroundImages();
        this.updateCanvasSize();
    }

    private updateCanvasSize(): void {
        // Get the actual display size from DOM
        const rect = this.canvas.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = displayWidth * (3/4); // Maintain 4:3 aspect ratio

        // Set canvas size
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
    }

    private getScaleFactor(): { x: number, y: number } {
        return {
            x: this.canvas.width / this.BASE_WIDTH,
            y: this.canvas.height / this.BASE_HEIGHT
        };
    }

    private scaleValue(value: number, axis: 'x' | 'y' = 'x'): number {
        const scale = this.getScaleFactor();
        return value * (axis === 'x' ? scale.x : scale.y);
    }

    private loadBackgroundImages(): void {
        const imagePaths = [
            '/assets/backgrounds/1.jpg',
            '/assets/backgrounds/2.jpg',
            '/assets/backgrounds/3.jpg',
            '/assets/backgrounds/4.jpg',
            '/assets/backgrounds/5.jpg',
        ];

        imagePaths.forEach((path) => {
            const img = new Image();
            img.src = path;
            this.backgroundImages.push(img);
        });
    }

    public initializeGame(settings: {
        winScore: number;
        ballSpeed: number;
        ballSize: number;
        paddleSpeed: number;
        paddleWidth: number;
        paddleHeight: number;
    }): void {
        this.updateCanvasSize();

        this.winScore = settings.winScore;
        this.score1 = 0;
        this.score2 = 0;
        this.gameOver = false;

        this.selectRandomBackground();

        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: this.scaleValue(settings.ballSize),
            speedX: this.scaleValue(settings.ballSpeed),
            speedY: this.scaleValue(settings.ballSpeed, 'y')
        };

        // Initialize paddle 1 (left)
        this.paddle1 = {
            x: this.scaleValue(20),
            y: (this.canvas.height - this.scaleValue(settings.paddleHeight, 'y')) / 2,
            width: this.scaleValue(settings.paddleWidth),
            height: this.scaleValue(settings.paddleHeight, 'y'),
            speed: this.scaleValue(settings.paddleSpeed, 'y')
        };

        // Initialize paddle 2 (right)
        this.paddle2 = {
            x: this.canvas.width - this.scaleValue(20) - this.scaleValue(settings.paddleWidth),
            y: (this.canvas.height - this.scaleValue(settings.paddleHeight, 'y')) / 2,
            width: this.scaleValue(settings.paddleWidth),
            height: this.scaleValue(settings.paddleHeight, 'y'),
            speed: this.scaleValue(settings.paddleSpeed, 'y')
        };
    }

    private selectRandomBackground(): void {
        if (this.backgroundImages.length > 0) {
            this.currentBackgroundIndex = Math.floor(Math.random() * this.backgroundImages.length);
        }
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

        this.drawBackground();
        this.drawBall();
        this.drawPaddles();
        this.drawScores();
        this.drawCenterLine();

        if (this.gameOver) {
            const winner = this.score1 >= this.winScore ? "Player 1" : "Player 2";
            this.drawStatusText(`${winner} WINS!`, "#FF0000");
        }
    }

    private drawBackground(): void {
        if (this.backgroundImages[this.currentBackgroundIndex]) {
            const img = this.backgroundImages[this.currentBackgroundIndex];

            // Bild auf Canvas-Größe skalieren und zeichnen
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

            // Semi-transparente Overlay für bessere Sichtbarkeit der Spielelemente
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; // 30% schwarzer Overlay
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        else {
            this.ctx.fillStyle = "#000000";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    private drawBall(): void {
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fill();

        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = this.scaleValue(2);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    private drawPaddles(): void {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
        this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = this.scaleValue(2);
        this.ctx.strokeRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
        this.ctx.strokeRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);
    }

    private drawScores(): void {
        this.ctx.font = `${this.scaleValue(32)}px Arial`;
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = this.scaleValue(3);

        this.ctx.textAlign = "left";
        this.ctx.strokeText(`Player 1: ${this.score1}`, this.scaleValue(50), this.scaleValue(40, 'y'));
        this.ctx.fillText(`Player 1: ${this.score1}`, this.scaleValue(50), this.scaleValue(40, 'y'));

        this.ctx.textAlign = "right";
        this.ctx.strokeText(`Player 2: ${this.score2}`, this.canvas.width - this.scaleValue(50), this.scaleValue(40, 'y'));
        this.ctx.fillText(`Player 2: ${this.score2}`, this.canvas.width - this.scaleValue(50), this.scaleValue(40, 'y'));
    }

    private drawCenterLine(): void {
        const dashLength = this.scaleValue(10);
        this.ctx.setLineDash([dashLength, dashLength]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.strokeStyle = "#FFFFFF";
        this.ctx.lineWidth = this.scaleValue(3);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    public drawStatusText(text: string, color: string = "#FFFF00"): void {
        this.ctx.save();
        this.ctx.font = `${this.scaleValue(64)}px Arial`;
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = this.scaleValue(4);
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.shadowColor = "#000000";
        this.ctx.shadowBlur = this.scaleValue(10);

        this.ctx.strokeText(text, this.canvas.width / 2, this.canvas.height / 2);
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
        this.ball.radius = this.scaleValue(size);
    }

    public setBallSpeed(speed: number): void {
        const scaledSpeed = this.scaleValue(speed);
        const currentSpeed = Math.sqrt(this.ball.speedX ** 2 + this.ball.speedY ** 2);
        if (currentSpeed > 0) {
            const ratio = scaledSpeed / currentSpeed;
            this.ball.speedX *= ratio;
            this.ball.speedY *= ratio;
        }
        else {
            this.ball.speedX = scaledSpeed;
            this.ball.speedY = this.scaleValue(speed, 'y');
        }
    }

    public setPaddleWidth(width: number): void {
        const scaledWidth = this.scaleValue(width);
        this.paddle1.width = scaledWidth;
        this.paddle2.width = scaledWidth;
        this.paddle2.x = this.canvas.width - this.scaleValue(20) - scaledWidth;
    }

    public setPaddleHeight(height: number): void {
        const scaledHeight = this.scaleValue(height, 'y');
        const paddle1CenterY = this.paddle1.y + this.paddle1.height / 2;
        const paddle2CenterY = this.paddle2.y + this.paddle2.height / 2;

        this.paddle1.height = scaledHeight;
        this.paddle2.height = scaledHeight;

        this.paddle1.y = Math.max(0, Math.min(
            this.canvas.height - scaledHeight,
            paddle1CenterY - scaledHeight / 2
        ));

        this.paddle2.y = Math.max(0, Math.min(
            this.canvas.height - scaledHeight,
            paddle2CenterY - scaledHeight / 2
        ));
    }

    public setPaddleSpeed(speed: number): void {
        const scaledSpeed = this.scaleValue(speed, 'y');
        this.paddle1.speed = scaledSpeed;
        this.paddle2.speed = scaledSpeed;
    }
}
