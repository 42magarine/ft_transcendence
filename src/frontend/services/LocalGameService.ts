import type { IGameState } from "../../interfaces/interfaces.js";

interface BallStateWithVelocity {
    x: number;
    y: number;
    radius: number;
    velocityX: number;
    velocityY: number;
}

class LocalGameService {
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;
    private state: IGameState & { ball: BallStateWithVelocity } | null = null;
    private keysPressed: Record<string, boolean> = {};
    private inputLoop: number | null = null;
    private initialized: boolean = false;
    private paddleSpeed: number = 5;
    private winScore: number = 5;
    private countdownActive: boolean = false;

    constructor() {}

    public onCanvasReady(): void {
        if (this.initialized) return;

        console.log('[LocalGameService] onCanvasReady() called');
        this.initCanvas();
        this.setupEventListeners();
        this.setupKeyboardListeners();
        this.setupSliderListeners();
        this.initialized = true;
        console.log('[LocalGameService] Initialized');
    }

    private initCanvas(): void {
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }
        this.ctx = this.canvas.getContext("2d")!;
        this.resetGame();
        console.log('[LocalGameService] Canvas initialized');
    }

    private setupEventListeners(): void {
        console.log('[LocalGameService] Setting up event listeners');
        const startButton = document.getElementById("startGameButton") as HTMLButtonElement | null;
        const pauseButton = document.getElementById("pauseGameButton") as HTMLButtonElement | null;
        const resumeButton = document.getElementById("resumeGameButton") as HTMLButtonElement | null;
        const resetButton = document.getElementById("resetGameButton") as HTMLButtonElement | null;

        if (startButton) startButton.addEventListener("click", () => this.startGame());
        if (pauseButton) pauseButton.addEventListener("click", () => this.pauseGame());
        if (resumeButton) resumeButton.addEventListener("click", () => this.resumeGame());
        if (resetButton) resetButton.addEventListener("click", () => this.resetGame());
    }

    private setupKeyboardListeners(): void {
        console.log('[LocalGameService] Setting up keyboard listeners');
        window.addEventListener("keydown", (event: KeyboardEvent) => {
            this.keysPressed[event.key] = true;
        });

        window.addEventListener("keyup", (event: KeyboardEvent) => {
            this.keysPressed[event.key] = false;
        });

        const inputLoop = () => {
            this.handleInput();
            this.updateGame();
            this.draw();
            this.inputLoop = window.requestAnimationFrame(inputLoop);
        };

        this.inputLoop = window.requestAnimationFrame(inputLoop);
    }

    private async fadeText(text: string, color: string, duration: number): Promise<void> {
        const steps = 30;
        const interval = duration / steps;
        for (let i = 0; i < steps; i++) {
            this.draw(); // redraw game state
    
            const alpha = 1 - i / steps;
            this.ctx.globalAlpha = alpha;
            this.ctx.font = "64px Arial";
            this.ctx.fillStyle = color;
            this.ctx.textAlign = "center";
            this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.globalAlpha = 1;
    
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }

    
    private async countdown(): Promise<void> {
        if (!this.ctx || !this.canvas || !this.state) return;
    
        this.countdownActive = true;
        this.state.paused = true;
    
        for (let i = 3; i > 0; i--) {
            this.draw();
            this.ctx.font = "64px Arial";
            this.ctx.fillStyle = "#00FFFF";
            this.ctx.textAlign = "center";
            this.ctx.fillText(i.toString(), this.canvas.width / 2, this.canvas.height / 2);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    
        this.state.paused = false;
        this.draw();
    
        // Fade out "GO!" text
        await this.fadeText("GO!", "#00FF00", 2000);
    
        this.startGameLoop();
        this.countdownActive = false;
    }
    
    

    
    private setupSliderListeners(): void {
        const paddleSpeedInput = document.getElementById('paddleSpeedInput') as HTMLInputElement;
        const paddleHeightInput = document.getElementById('paddleHeightInput') as HTMLInputElement;
        const paddleWidthInput = document.getElementById('paddleWidthInput') as HTMLInputElement;
        const ballSpeedInput = document.getElementById('ballSpeedInput') as HTMLInputElement;
        const ballSizeInput = document.getElementById('ballSizeInput') as HTMLInputElement;
        const winScoreInput = document.getElementById('winScoreInput') as HTMLInputElement;
    
        if (paddleSpeedInput) {
            paddleSpeedInput.addEventListener('input', () => {
                const val = parseFloat(paddleSpeedInput.value);
                if (!isNaN(val)) this.updatePaddleSpeed(val);
            });
        }
    
        if (paddleHeightInput) {
            paddleHeightInput.addEventListener('input', () => {
                const val = parseFloat(paddleHeightInput.value);
                if (!isNaN(val)) this.updatePaddleHeight(val);
            });
        }
    
        if (paddleWidthInput) {
            paddleWidthInput.addEventListener('input', () => {
                const val = parseFloat(paddleWidthInput.value);
                if (!isNaN(val)) this.updatePaddleWidth(val);
            });
        }
    
        if (ballSpeedInput) {
            ballSpeedInput.addEventListener('input', () => {
                const val = parseFloat(ballSpeedInput.value);
                if (!isNaN(val)) this.updateBallSpeed(val);
            });
        }
    
        if (ballSizeInput) {
            ballSizeInput.addEventListener('input', () => {
                const val = parseFloat(ballSizeInput.value);
                if (!isNaN(val)) this.updateBallSize(val);
            });
        }
    
        if (winScoreInput) {
            winScoreInput.addEventListener('input', () => {
                const val = parseInt(winScoreInput.value);
                if (!isNaN(val)) this.updateWinScore(val);
            });
        }
    }
    

    
    private async startGame(): Promise<void> {
        if (this.state) {
            this.stopGameLoop();
            await this.countdown();
        }
    }
    

    private pauseGame(): void {
        if (this.state) this.state.paused = true;
    }

   
    private async resumeGame(): Promise<void> {
        if (this.state) {
            this.stopGameLoop();
            await this.countdown();
        }
    }
    private resetGame(): void {
        const paddleSpeed = parseInt((document.getElementById('paddleSpeedInput') as HTMLInputElement)?.value || '5');
        const paddleHeight = parseInt((document.getElementById('paddleHeightInput') as HTMLInputElement)?.value || '100');
        const ballSpeedX = parseInt((document.getElementById('ballSpeedXInput') as HTMLInputElement)?.value || '5');
        const ballSpeedY = parseInt((document.getElementById('ballSpeedYInput') as HTMLInputElement)?.value || '5');
        const winScore = parseInt((document.getElementById('winScoreInput') as HTMLInputElement)?.value || '5');
        this.paddleSpeed = isNaN(paddleSpeed) ? 5 : paddleSpeed;
        this.winScore = isNaN(winScore) ? 5 : winScore;
    
        this.state = {
            ball: { x: 400, y: 300, radius: 10, velocityX: ballSpeedX, velocityY: ballSpeedY },
            paddle1: { x: 20, y: 250, width: 20, height: paddleHeight },
            paddle2: { x: 760, y: 250, width: 20, height: paddleHeight },
            score1: 0,
            score2: 0,
            paused: true,
            running: false,
            gameIsOver: false
        };
    
        this.draw();
    }    

    private handleInput(): void {
        if (!this.state || this.state.paused || this.state.gameIsOver) return;
    
        const speed = this.paddleSpeed;
        if (this.keysPressed["w"] || this.keysPressed["W"]) this.state.paddle1.y -= speed;
        if (this.keysPressed["s"] || this.keysPressed["S"]) this.state.paddle1.y += speed;
        if (this.keysPressed["ArrowUp"]) this.state.paddle2.y -= speed;
        if (this.keysPressed["ArrowDown"]) this.state.paddle2.y += speed;
    }
    

    private async updateGame(): Promise<void> {
    
        if (!this.state || this.state.paused || this.state.gameIsOver) return;

        const ball = this.state.ball;
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;

        if (ball.y <= 0 || ball.y >= this.canvas.height) ball.velocityY *= -1;

        const paddle1 = this.state.paddle1;
        const paddle2 = this.state.paddle2;

        if (ball.x <= paddle1.x + paddle1.width &&
            ball.y >= paddle1.y &&
            ball.y <= paddle1.y + paddle1.height) {
            ball.velocityX *= -1;
        } else if (ball.x + ball.radius >= paddle2.x &&
                   ball.y >= paddle2.y &&
                   ball.y <= paddle2.y + paddle2.height) {
            ball.velocityX *= -1;
        }

        if (ball.x < 0) {
            this.state.score2++;
            await this.resetBall();
        } else if (ball.x > this.canvas.width) {
            this.state.score1++;
            await this.resetBall();
        }
        if (this.state.score1 >= this.winScore || this.state.score2 >= this.winScore) {

            this.state.gameIsOver = true;
            this.state.paused = true;
            this.stopGameLoop();
        }
    }

    private async resetBall(): Promise<void> {
        if (!this.state) return;
    
        // Reset ball position to center
        this.state.ball.x = this.canvas.width / 2;
        this.state.ball.y = this.canvas.height / 2;
    
        // Reverse X direction, keep current Y direction (or set new Y speed)
        this.state.ball.velocityX *= -1;
        this.state.ball.velocityY = 5;
    
        // If game is over, do not start countdown
        if (this.state.gameIsOver) return;
    
        await this.countdown();
    }
    

    private draw(): void {
        if (!this.state || !this.ctx || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.beginPath();
        this.ctx.arc(this.state.ball.x, this.state.ball.y, this.state.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fill();
        this.ctx.closePath();

        this.ctx.fillStyle = "#FF0000";
        this.ctx.fillRect(this.state.paddle1.x, this.state.paddle1.y, this.state.paddle1.width, this.state.paddle1.height);
        this.ctx.fillRect(this.state.paddle2.x, this.state.paddle2.y, this.state.paddle2.width, this.state.paddle2.height);

        this.ctx.strokeStyle = "#00FF00";
        this.ctx.strokeRect(this.state.paddle1.x, this.state.paddle1.y, this.state.paddle1.width, this.state.paddle1.height);
        this.ctx.strokeRect(this.state.paddle2.x, this.state.paddle2.y, this.state.paddle2.width, this.state.paddle2.height);

        this.ctx.font = "24px Arial";
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillText(`Player 1: ${this.state.score1}`, 50, 30);
        this.ctx.fillText(`Player 2: ${this.state.score2}`, this.canvas.width - 180, 30);

        if (this.state.paused && !this.state.gameIsOver && !this.countdownActive) {
            this.ctx.font = "48px Arial";
            this.ctx.fillStyle = "#FFFF00";
            this.ctx.textAlign = "center";
            this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = "left";
        }

        if (this.state.gameIsOver) {
            this.ctx.font = "48px Arial";
            this.ctx.fillStyle = "#FF0000";
            this.ctx.textAlign = "center";
            const winner = this.state.score1 > this.state.score2 ? "Player 1" : "Player 2";
            this.ctx.fillText(`${winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = "left";
        }
    }

    public updatePaddleSpeed(speed: number): void {
        this.paddleSpeed = speed;
    }
    
    public updatePaddleHeight(height: number): void {
        if (!this.state) return;
        this.state.paddle1.height = height;
        this.state.paddle2.height = height;
    }
    
    public updateBallSpeedX(speedX: number): void {
        if (!this.state) return;
        this.state.ball.velocityX = speedX * Math.sign(this.state.ball.velocityX);
    }
    
    public updateBallSpeed(speed: number): void {
        if (!this.state) return;
        this.state.ball.velocityX = speed * Math.sign(this.state.ball.velocityX);
        this.state.ball.velocityY = speed * Math.sign(this.state.ball.velocityY);
    }
    
    public updateBallSize(size: number): void {
        if (!this.state) return;
        this.state.ball.radius = size;
    }
    
    public updatePaddleWidth(width: number): void {
        if (!this.state) return;
        this.state.paddle1.width = width;
        this.state.paddle2.width = width;
    }
    
    public updateWinScore(score: number): void {
        this.winScore = score;
    }
    
    

    public cleanup(): void {
        if (this.inputLoop !== null) {
            this.inputLoop = null;
        }

        this.initialized = false;
        console.log("LocalGameService cleaned up");
    }

    private stopGameLoop(): void {
        if (this.inputLoop !== null) {
            cancelAnimationFrame(this.inputLoop);
            this.inputLoop = null;
        }
    }
    
    private startGameLoop(): void {
        const inputLoop = () => {
            this.handleInput();
            this.updateGame();
            this.draw();
            this.inputLoop = window.requestAnimationFrame(inputLoop);
        };
        this.inputLoop = window.requestAnimationFrame(inputLoop);
    }

    
}

const localGameService = new LocalGameService();
export default localGameService;
