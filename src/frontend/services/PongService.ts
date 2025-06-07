import { IServerMessage, IPaddleDirection, IGameState, IPlayerState } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';

export default class PongService {
    private gameState!: IGameState;
    private player1!: IPlayerState;
    private player2!: IPlayerState;
    private isPlayer1Paddle: boolean = false;
    private isPlayer2Paddle: boolean = false;

    private canvas!: HTMLCanvasElement;
    private overlay!: HTMLElement;
    private ctx!: CanvasRenderingContext2D;

    private wPressed: boolean = false;
    private sPressed: boolean = false;

    private animationFrameId: number | null = null;

    constructor() {
        this.handleSocketMessage = this.handleSocketMessage.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.draw = this.draw.bind(this);
        this.clientLoop = this.clientLoop.bind(this);
    }

    public setupEventListener(): void {
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        if (!this.canvas) {
            console.error("[PongService] Could not find gameCanvas element.");
            throw new Error("Canvas element not found.");
        }

        this.overlay = document.getElementById("gameCanvasWrap-overlay") as HTMLElement;
        if (!this.overlay) {
            console.error("[PongService] Could not find overlay element.");
            throw new Error("Overlay element not found.");
        }

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            console.error("[PongService] Could not get 2D rendering context for canvas.");
            throw new Error("Canvas context not available.");
        }

        this.ctx = ctx;

        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        let countdown = 3;
        this.overlay.textContent = countdown.toString();
        const timer = setInterval(() => {
            countdown--;

            if (countdown == 3) {
                this.overlay.classList.add("third");
                this.overlay.textContent = countdown.toString();
            } else if (countdown == 2) {
                this.overlay.classList.remove("third");
                this.overlay.classList.add("second");
                this.overlay.textContent = countdown.toString();
            } else if (countdown == 1) {
                this.overlay.classList.remove("second");
                this.overlay.classList.add("first");
                this.overlay.textContent = countdown.toString();
            } else if (countdown === 0) {
                this.overlay.classList.remove("first");
                this.overlay.classList.add("ready");
                this.overlay.textContent = 'START!';
            } else {
                this.overlay.style.display = 'none';
                clearInterval(timer);
            }
        }, 1000);

    }

    private getCurrentLobbyIdFromUrl(): string {
        const match = window.location.pathname.match(/\/pong\/([^/]+)/);
        return match?.[1] || '';
    }

    public handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);
        const currentUrlLobbyId = this.getCurrentLobbyIdFromUrl();
        //console.log("frontend received: " + data.type);

        console.log("PongService msg received: " + data.type)

        switch (data.type) {
            case 'gameJoined':
                this.gameState = data.gameState!;
                this.player1 = data.player1!;
                this.player2 = data.player2!;

                if (window.currentUser?.id === this.player1.userId) {
                    this.isPlayer1Paddle = true;
                    this.isPlayer2Paddle = false;
                    console.log(`[PongService] Identified as Player 1 (User ID: ${window.currentUser?.id})`);
                }
                else if (window.currentUser?.id === this.player2.userId) {
                    this.isPlayer1Paddle = false;
                    this.isPlayer2Paddle = true;
                    console.log(`[PongService] Identified as Player 2 (User ID: ${window.currentUser?.id})`);
                }
                else {
                    console.warn(`[PongService] Current user ID ${window.currentUser?.id} is neither Player 1 nor Player 2 in this game.`);
                }

                // NEW: Start the client-side input loop when the game is joined
                if (this.animationFrameId === null) {
                    this.clientLoop();
                }

                setTimeout(function () {
                    if (window.messageHandler && currentUrlLobbyId) {
                        window.messageHandler.startGame(currentUrlLobbyId);
                    }
                }, 4000)
                break;

            case 'gameUpdate':
                this.gameState = data.gameState!;
                this.draw();

                // NEW: If game was paused and is now un-paused, restart the loop
                if (!this.gameState.paused && !this.gameState.gameIsOver && this.animationFrameId === null) {
                    this.clientLoop();
                }
                break;
            case "playerLeft":
                this.overlay.classList.remove("first");
                this.overlay.classList.add("terminated");
                this.overlay.textContent = 'Terminated\nby Opponent<span>you will be redirected!';
                setTimeout(function () {
                    Router.redirect("/lobbylist")
                }, 10000)
                break;
            case "playerLeft":
                this.overlay.classList.remove("first");
                this.overlay.classList.add("terminated");
                this.overlay.textContent = 'Terminated\nby Opponent<span>you will be redirected!';
                setTimeout(function () {
                    Router.redirect("/lobbylist")
                }, 10000)
                break;
        }
    }

    private clientLoop(): void {

        if (!window.currentUser?.id || !this.gameState || this.gameState.gameIsOver || this.gameState.paused) {
            this.animationFrameId = null;
            return;
        }

        let direction: IPaddleDirection | null = null;
        if (this.wPressed) {
            direction = 'up';
        } else if (this.sPressed) {
            direction = 'down';
        }

        if (direction && window.messageHandler) {
            if (this.isPlayer1Paddle || this.isPlayer2Paddle) {
                window.messageHandler.movePaddle(window.currentUser?.id, direction);
            }
        }

        this.animationFrameId = requestAnimationFrame(this.clientLoop);
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (!window.currentUser?.id || !this.gameState || this.gameState.gameIsOver || this.gameState.paused) {
            return;
        }

        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.wPressed = true;
                break;
            case 's':
            case 'arrowdown':
                this.sPressed = true;
                break;
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.wPressed = false;
                break;
            case 's':
            case 'arrowdown':
                this.sPressed = false;
                break;
        }
    }

    private draw(): void {
        this.overlay.classList.remove("ready");
        this.overlay.classList.add("hidden")
        if (!this.ctx) {
            return;
        }

        if (!this.gameState) {
            console.warn("[PongService] Draw called but gameState is not ready.");
            return;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '30px "Press Start 2P", Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw paddles
        this.ctx.fillRect(this.gameState.paddle1.x, this.gameState.paddle1.y, this.gameState.paddle1.width, this.gameState.paddle1.height);
        this.ctx.fillRect(this.gameState.paddle2.x, this.gameState.paddle2.y, this.gameState.paddle2.width, this.gameState.paddle2.height);

        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.gameState.ball.x, this.gameState.ball.y, this.gameState.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw scores
        this.ctx.fillText(this.gameState.score1.toString(), this.canvas.width / 4, 50);
        this.ctx.fillText(this.gameState.score2.toString(), (this.canvas.width / 4) * 3, 50);

        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        if (this.gameState.gameIsOver) {
            this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2);
            let winMsg = "";
            if (this.gameState.score1 > this.gameState.score2) {
                winMsg = this.player1.userName + ` wins`;
            } else if (this.gameState.score2 > this.gameState.score1) {
                winMsg = this.player2.userName + ` wins`;
            }
            this.ctx.fillText(winMsg, this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.fillText(`Final Score: ${this.gameState.score1} - ${this.gameState.score2}`, this.canvas.width / 2, this.canvas.height / 2 + 80);
        }
    }

    public getGameState(): IGameState {
        return this.gameState;
    }

    public getPlayer1(): IPlayerState {
        return this.player1;
    }

    public getPlayer2(): IPlayerState {
        return this.player2;
    }
}
