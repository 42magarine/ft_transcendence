import { ClientMessage, ServerMessage, IGameState } from "../../interfaces/interfaces.js";
import { IPaddleDirection } from "../../interfaces/interfaces.js";

class LocalGameService {
    private socket!: WebSocket;
    private socketReady: Promise<void> = Promise.resolve();
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;
    private state: IGameState | null = null;
    private playerId: number | null = null;
    private keysPressed: Record<string, boolean> = {};
    private inputLoop: number | null = null;
    private initialized: boolean = false;

    // Singleton instance

    constructor() {
    }

    public initialize(): void {
        if (this.initialized) {
            return;
        }

        document.addEventListener('RouterContentLoaded', () => {
            this.initSocket();
            this.initCanvas();
            this.setupEventListeners();
            this.setupKeyboardListeners();
            this.initialized = true;
        });
    }

    public initSocket(): void {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.socket = new WebSocket(`${wsProtocol}//${window.location.host}/api/game/wss`);
        this.socketReady = this.webSocketWrapper(this.socket).then(() => {
            console.log('Connected to WebSocket server for local game');
        }).catch((err) => {
            console.error('WebSocket connection error:', err);
        });

        this.socket.addEventListener('message', (event: MessageEvent<string>) => {
            const data: ServerMessage = JSON.parse(event.data);

            if (data.type === "assignPlayer") {
                this.playerId = data.id;
                this.state = data.state!;
                this.draw();
            }

            if (data.type === "startGame" ||
                data.type === "update" ||
                data.type === "gameUpdate" ||
                data.type === "pauseGame" ||
                data.type === "resumeGame" ||
                data.type === "resetGame") {
                this.state = data.state!;
                this.draw();
            }
        });
    }

    private webSocketWrapper(socket: WebSocket): Promise<void> {
        return new Promise((resolve, reject) => {
            if (socket.readyState === WebSocket.OPEN) {
                resolve();
            } else {
                socket.addEventListener('open', () => resolve(), { once: true });
                socket.addEventListener('error', () =>
                    reject(new Error('WebSocket connection failed')), { once: true });
            }
        });
    }

    private initCanvas(): void {
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }
        this.ctx = this.canvas.getContext("2d")!;
    }

    private setupEventListeners(): void {
        const startButton = document.getElementById("startGameButton") as HTMLButtonElement | null;
        const pauseButton = document.getElementById("pauseGameButton") as HTMLButtonElement | null;
        const resumeButton = document.getElementById("resumeGameButton") as HTMLButtonElement | null;
        const resetButton = document.getElementById("resetGameButton") as HTMLButtonElement | null;

        if (startButton) {
            startButton.addEventListener("click", () => {
                const startMsg: ClientMessage = { type: "startGame" };
                this.safeSend(startMsg);
            });
        }

        if (pauseButton) {
            pauseButton.addEventListener("click", () => {
                const pauseMsg: ClientMessage = { type: "pauseGame" };
                this.safeSend(pauseMsg);
            });
        }

        if (resumeButton) {
            resumeButton.addEventListener("click", () => {
                const resumeMsg: ClientMessage = { type: "resumeGame" };
                this.safeSend(resumeMsg);
            });
        }

        if (resetButton) {
            resetButton.addEventListener("click", () => {
                const resetMsg: ClientMessage = { type: "resetGame" };
                this.safeSend(resetMsg);
            });
        }

        // Cleanup on page unload
        window.addEventListener("beforeunload", () => {
            const msg: ClientMessage = { type: "resetGame" };
            this.safeSend(msg);
        });

        window.addEventListener("unload", () => {
            const msg: ClientMessage = { type: "resetGame" };
            this.safeSend(msg);
        });
    }

    private setupKeyboardListeners(): void {
        window.addEventListener("keydown", (event: KeyboardEvent) => {
            this.keysPressed[event.key] = true;
        });

        window.addEventListener("keyup", (event: KeyboardEvent) => {
            this.keysPressed[event.key] = false;
        });

        const inputLoop = () => {
            this.handleInput();
            this.inputLoop = requestAnimationFrame(inputLoop);
        };

        this.inputLoop = requestAnimationFrame(inputLoop);
    }

    private handleInput(): void {
        if (!this.state || this.state.paused) {
            return;
        }

        if (this.playerId === 1) {
            if (this.keysPressed["w"] || this.keysPressed["W"]) {
                this.sendMovePaddle("up");
            }
            if (this.keysPressed["s"] || this.keysPressed["S"]) {
                this.sendMovePaddle("down");
            }
        } else if (this.playerId === 2) {
            if (this.keysPressed["ArrowUp"]) {
                this.sendMovePaddle("up");
            }
            if (this.keysPressed["ArrowDown"]) {
                this.sendMovePaddle("down");
            }
        }
    }

    private sendMovePaddle(direction: IPaddleDirection): void {
        const moveMsg: ClientMessage = {
            type: "movePaddle",
            direction: direction
        };
        this.safeSend(moveMsg);
    }

    private safeSend(msg: ClientMessage): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(msg));
        } else {
            console.warn("Tried to send a message but WebSocket is not open:", msg);
        }
    }

    private draw(): void {
        if (!this.state || !this.ctx || !this.canvas) {
            return;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.state.ball.x, this.state.ball.y, this.state.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fill();
        this.ctx.closePath();

        // Draw paddles (filled)
        this.ctx.fillStyle = "#FF0000";
        this.ctx.fillRect(this.state.paddle1.x, this.state.paddle1.y, this.state.paddle1.width, this.state.paddle1.height);
        this.ctx.fillRect(this.state.paddle2.x, this.state.paddle2.y, this.state.paddle2.width, this.state.paddle2.height);

        // Add paddle hitbox outlines for debugging
        this.ctx.strokeStyle = "#00FF00";
        this.ctx.strokeRect(this.state.paddle1.x, this.state.paddle1.y, this.state.paddle1.width, this.state.paddle1.height);
        this.ctx.strokeRect(this.state.paddle2.x, this.state.paddle2.y, this.state.paddle2.width, this.state.paddle2.height);

        // Draw scores
        this.ctx.font = "24px Arial";
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillText(`Player 1: ${this.state.score1}`, 50, 30);
        this.ctx.fillText(`Player 2: ${this.state.score2}`, this.canvas.width - 180, 30);

        // Draw pause indicator
        if (this.state.paused) {
            this.ctx.font = "48px Arial";
            this.ctx.fillStyle = "#FFFF00";
            this.ctx.textAlign = "center";
            this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = "left"; // Reset text align
        }

        // Draw game over indicator
        if (this.state.gameIsOver) {
            this.ctx.font = "48px Arial";
            this.ctx.fillStyle = "#FF0000";
            this.ctx.textAlign = "center";
            const winner = this.state.score1 > this.state.score2 ? "Player 1" : "Player 2";
            this.ctx.fillText(`${winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = "left"; // Reset text align
        }
    }

    public cleanup(): void {
        if (this.inputLoop !== null) {
            cancelAnimationFrame(this.inputLoop);
            this.inputLoop = null;
        }

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close();
        }

        this.initialized = false;
        console.log("LocalGameService cleaned up");
    }

    // Getters for accessing current state (optional)
    public getPlayerId(): number | null {
        return this.playerId;
    }

    public getGameState(): IGameState | null {
        return this.state;
    }

    public isConnected(): boolean {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }
}

// Create and initialize the singleton instance
const localGameService = new LocalGameService();
localGameService.initialize();

export default localGameService;
