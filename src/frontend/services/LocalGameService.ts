// core/LocalGameService.ts
import type { IGameState } from "../../interfaces/interfaces.js";
import type { BallStateWithVelocity } from "./GameLogic.js";
import LocalGameLogic from "./GameLogic.js";

class LocalGameService {
	private canvas!: HTMLCanvasElement;
	private ctx!: CanvasRenderingContext2D;
	private paddleSpeed: number = 5;
	private winScore: number = 5;
	private gameLogic: LocalGameLogic | null = null;
	private initialized = false;
	private keysPressed: Record<string, boolean> = {};

	constructor() {}

	public onCanvasReady(): void {
		if (this.initialized) return;
		this.initialized = true;

		this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
		if (!this.canvas) throw new Error("Canvas not found");
		this.ctx = this.canvas.getContext("2d")!;
		
		this.setupSliderListeners();
		this.setupButtonListeners();
		this.setupKeyboardListeners();
		this.resetGame();

		requestAnimationFrame(this.gameLoop.bind(this));
	}

	private resetGame(): void {
		const paddleSpeed = parseInt((document.getElementById('paddleSpeedInput') as HTMLInputElement)?.value || '5');
		const paddleHeight = parseInt((document.getElementById('paddleHeightInput') as HTMLInputElement)?.value || '100');
		const ballSpeed = parseInt((document.getElementById('ballSpeedInput') as HTMLInputElement)?.value || '5');
		const winScore = parseInt((document.getElementById('winScoreInput') as HTMLInputElement)?.value || '5');

		this.paddleSpeed = isNaN(paddleSpeed) ? 5 : paddleSpeed;
		this.winScore = isNaN(winScore) ? 5 : winScore;

		this.gameLogic = new LocalGameLogic(this.canvas, this.paddleSpeed, this.winScore);
		this.gameLogic.updateBallSpeed(ballSpeed);
		this.gameLogic.updatePaddleSize(paddleHeight, 20); // Default width = 20
	}

	private setupButtonListeners(): void {
		const startBtn = document.getElementById('startGameButton');
		const pauseBtn = document.getElementById('pauseGameButton');
		const resetBtn = document.getElementById('resetGameButton');
		const resumeBtn = document.getElementById('resumeGameButton');

		if (startBtn) {
			startBtn.addEventListener('click', () => {
				console.debug('[Button] Start clicked');
				this.resetGame();
                this.gameLogic?.startCountdown(() => {
                    console.debug("[Countdown] Game started");
                });
			});
		}

		if (pauseBtn) {
			pauseBtn.addEventListener('click', () => {
				console.debug('[Button] Pause clicked');
				this.gameLogic?.setPaused(true);
			});
		}

		if (resumeBtn) {
			resumeBtn.addEventListener('click', () => {
				console.debug('[Button] Resume clicked');
                    this.gameLogic?.startCountdown(() => {
                        console.debug("[Countdown] Game started");
                    });

			});
		}

		if (resetBtn) {
			resetBtn.addEventListener('click', () => {
				console.debug('[Button] Reset clicked');
				this.resetGame();
			});
		}
	}

	private setupKeyboardListeners(): void {
		window.addEventListener('keydown', (e) => {
			this.keysPressed[e.key.toLowerCase()] = true;
		});

		window.addEventListener('keyup', (e) => {
			this.keysPressed[e.key.toLowerCase()] = false;
		});
	}

	private setupSliderListeners(): void {
		const map = {
			paddleSpeedInput: (val: number) => this.updatePaddleSpeed(val),
			paddleHeightInput: (val: number) => this.updatePaddleHeight(val),
			paddleWidthInput: (val: number) => this.updatePaddleWidth(val),
			ballSpeedInput: (val: number) => this.updateBallSpeed(val),
			ballSizeInput: (val: number) => this.updateBallSize(val),
			winScoreInput: (val: number) => this.updateWinScore(val)
		};

		type InputId = keyof typeof map;

		for (const id in map) {
			const input = document.getElementById(id) as HTMLInputElement;
			if (input) {
				input.addEventListener('input', () => {
					const val = parseFloat(input.value);
					if (!isNaN(val)) map[id as InputId](val);
				});
			}
		}
	}

	private gameLoop(): void {
		if (this.gameLogic) {
			// Player 1 movement (W/S)
			if (this.keysPressed['w']) this.gameLogic.movePaddle(1, "up");
			if (this.keysPressed['s']) this.gameLogic.movePaddle(1, "down");

			// Player 2 movement (Arrow keys)
			if (this.keysPressed['arrowup']) this.gameLogic.movePaddle(2, "up");
			if (this.keysPressed['arrowdown']) this.gameLogic.movePaddle(2, "down");

			this.gameLogic.update();
			this.gameLogic.draw();
		}
		requestAnimationFrame(this.gameLoop.bind(this));
	}

	// ---- Forwarded setters ----

	public updatePaddleSpeed(speed: number): void {
		this.paddleSpeed = speed;
		if (this.gameLogic) this.gameLogic.updatePaddleSpeed(speed);
	}

	public updatePaddleHeight(height: number): void {
		if (this.gameLogic) {
			const width = this.getPaddleWidth();
			this.gameLogic.updatePaddleSize(height, width);
		}
	}

	public updatePaddleWidth(width: number): void {
		if (this.gameLogic) {
			const height = this.getPaddleHeight();
			this.gameLogic.updatePaddleSize(height, width);
		}
	}

	public updateBallSpeed(speed: number): void {
		if (this.gameLogic) this.gameLogic.updateBallSpeed(speed);
	}

	public updateBallSize(size: number): void {
		if (this.gameLogic) this.gameLogic.updateBallSize(size);
	}

	public updateWinScore(score: number): void {
		this.winScore = score;
		if (this.gameLogic) this.gameLogic.updateWinScore(score);
	}

	// ---- Getters ----

	public getGameState(): IGameState & { ball: BallStateWithVelocity } | null {
		return this.gameLogic?.state || null;
	}

	public getCanvas(): HTMLCanvasElement {
		return this.canvas;
	}

	public getContext(): CanvasRenderingContext2D {
		return this.ctx;
	}

	public getPaddleSpeed(): number {
		return this.paddleSpeed;
	}

	public getPaddleHeight(): number {
		return this.gameLogic?.state?.paddle1?.height || 100;
	}

	public getPaddleWidth(): number {
		return this.gameLogic?.state?.paddle1?.width || 20;
	}

	public getWinScore(): number {
		return this.winScore;
	}
}

const localGameService = new LocalGameService();
export default localGameService;
