import LocalGameLogic from "./LocalGameLogic.js";
import { SCORE_LIMIT, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED, BALL_RADIUS, BALL_SPEED } from "../../types/constants.js";

enum GameState {
    STOPPED = 'stopped',
    COUNTDOWN = 'countdown',
    RUNNING = 'running',
    PAUSED = 'paused',
    GAME_OVER = 'gameOver'
}

export default class LocalGameService {
    private localGameLogic!: LocalGameLogic;
    private keysPressed: Record<string, boolean> = {};
    private gameState: GameState = GameState.STOPPED;
    private countdownNumber: number = 3;

    // Speichere die gebundenen Funktionen als Klasseneigenschaften
    private boundKeyDownHandler: (event: KeyboardEvent) => void;
    private boundKeyUpHandler: (event: KeyboardEvent) => void;

    constructor() {
        // Binde die Handler einmal im Constructor
        this.boundKeyDownHandler = this.handleKeyDown.bind(this);
        this.boundKeyUpHandler = this.handleKeyUp.bind(this);
    }

    public onCanvasReady(): void {
        const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        if (!canvas) {
            throw new Error("Canvas not found");
        }
        this.localGameLogic = new LocalGameLogic(canvas);

        this.setupSliderListeners();
        this.setupButtonListeners();
        this.setupKeyboardListeners();

        this.localGameLogic.initializeGame(this.getAllSettings());
        this.startMainLoop();
    }

    private setupSliderListeners(): void {
        const sliderMap = new Map<string, (value: number) => void>([
            ['winScoreInput', (value) => this.localGameLogic.setWinScore(value)],
            ['paddleWidthInput', (value) => this.localGameLogic.setPaddleWidth(value)],
            ['paddleHeightInput', (value) => this.localGameLogic.setPaddleHeight(value)],
            ['paddleSpeedInput', (value) => this.localGameLogic.setPaddleSpeed(value)],
            ['ballSizeInput', (value) => this.localGameLogic.setBallSize(value)],
            ['ballSpeedInput', (value) => this.localGameLogic.setBallSpeed(value)]
        ]);

        sliderMap.forEach((setterFn, sliderId) => {
            const input = document.getElementById(sliderId) as HTMLInputElement;
            if (input) {
                input.addEventListener('input', () => {
                    const value = parseInt(input.value);
                    if (!isNaN(value)) {
                        setterFn(value);
                    }
                });
            }
        });
    }

    private setupButtonListeners(): void {
        const startBtn = document.getElementById('startGameButton');
        const stopBtn = document.getElementById('stopGameButton');
        const resetBtn = document.getElementById('resetGameButton');

        startBtn?.addEventListener('click', () => this.startGame());
        stopBtn?.addEventListener('click', () => this.stopGame());
        resetBtn?.addEventListener('click', () => this.resetGame());
    }

    private setupKeyboardListeners(): void {
        window.addEventListener('keydown', this.boundKeyDownHandler);
        window.addEventListener('keyup', this.boundKeyUpHandler);
    }

    private handleKeyUp(event: KeyboardEvent): void {
        const preventDefaultKeys = ['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'];
        if (preventDefaultKeys.includes(event.code)) {
            event.preventDefault();
        }
        this.keysPressed[event.code.toLowerCase()] = false;
    }

    private handleKeyDown(event: KeyboardEvent): void {
        const preventDefaultKeys = ['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'];
        if (preventDefaultKeys.includes(event.code)) {
            event.preventDefault();
        }
        this.keysPressed[event.code.toLowerCase()] = true;
    }

    private startGame(): void {
        if (this.gameState === GameState.RUNNING || this.gameState === GameState.COUNTDOWN) {
            return;
        }

        if (this.gameState === GameState.PAUSED) {
            this.gameState = GameState.RUNNING;
            return;
        }

        this.gameState = GameState.COUNTDOWN;
        this.countdownNumber = 3;
        this.localGameLogic.initializeGame(this.getAllSettings());
    }

    private stopGame(): void {
        if (this.gameState === GameState.RUNNING) {
            this.gameState = GameState.PAUSED;
        }
        else if (this.gameState === GameState.COUNTDOWN) {
            this.gameState = GameState.STOPPED;
        }
    }

    private resetGame(): void {
        this.gameState = GameState.STOPPED;
        this.localGameLogic.initializeGame(this.getAllSettings());
    }

    private startMainLoop(): void {
        const loop = () => {
            this.handleGameState();
            requestAnimationFrame(loop);
        };
        loop();
    }

    private getAllSettings() {
        return {
            winScore: this.getSliderValue('winScoreInput', SCORE_LIMIT),
            paddleWidth: this.getSliderValue('paddleWidthInput', PADDLE_WIDTH),
            paddleHeight: this.getSliderValue('paddleHeightInput', PADDLE_HEIGHT),
            paddleSpeed: this.getSliderValue('paddleSpeedInput', PADDLE_SPEED),
            ballSize: this.getSliderValue('ballSizeInput', BALL_RADIUS),
            ballSpeed: this.getSliderValue('ballSpeedInput', BALL_SPEED)
        };
    }

    private getSliderValue(id: string, defaultValue: number): number {
        const input = document.getElementById(id) as HTMLInputElement;
        if (!input) {
            return defaultValue;
        }
        const value = parseInt(input.value);
        return isNaN(value) ? defaultValue : value;
    }

    private handleGameState(): void {
        switch (this.gameState) {
            case GameState.STOPPED:
                this.processInput();
                this.localGameLogic.draw();
                this.localGameLogic.drawStatusText("PRESS START", "#00FF00");
                break;

            case GameState.COUNTDOWN:
                this.processInput();
                this.localGameLogic.draw();
                this.localGameLogic.drawStatusText(this.countdownNumber.toString(), "#FFFF00");

                if (Date.now() % 1000 < 17) {
                    this.countdownNumber--;
                    if (this.countdownNumber <= 0) {
                        this.gameState = GameState.RUNNING;
                    }
                }
                break;

            case GameState.RUNNING:
                this.processInput();
                this.localGameLogic.update();
                this.localGameLogic.draw();

                if (this.localGameLogic.isGameOver()) {
                    this.gameState = GameState.GAME_OVER;
                }
                break;

            case GameState.PAUSED:
                this.localGameLogic.draw();
                this.localGameLogic.drawStatusText("PAUSED", "#FFFF00");
                break;

            case GameState.GAME_OVER:
                this.localGameLogic.draw();
                break;
        }
    }

    private processInput(): void {
        if (this.keysPressed['keyw']) {
            this.localGameLogic.movePaddle(1, "up");
        }
        if (this.keysPressed['keys']) {
            this.localGameLogic.movePaddle(1, "down");
        }
        if (this.keysPressed['arrowup']) {
            this.localGameLogic.movePaddle(2, "up");
        }
        if (this.keysPressed['arrowdown']) {
            this.localGameLogic.movePaddle(2, "down");
        }
    }

    public cleanup(): void {
        window.removeEventListener('keydown', this.boundKeyDownHandler);
        window.removeEventListener('keyup', this.boundKeyUpHandler);
        this.keysPressed = {};
        this.gameState = GameState.STOPPED;
    }
}