import { IServerMessage, IPaddleDirection, IGameState, IPlayerState } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';
import UserService from './UserService.js';

export default class PongService {
    private gameState!: IGameState;
    private player1!: IPlayerState;
    private player2!: IPlayerState;
    private playerUserId!: number;
    private isPlayer1Paddle: boolean = false; // Flag if this client controls paddle1
    private isPlayer2Paddle: boolean = false; // Flag if this client controls paddle2

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private wPressed: boolean = false;
    private sPressed: boolean = false;

    constructor() {
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement
        const context = this.canvas.getContext('2d');
        if (!context) {
            console.error("[PongService] Could not get 2D rendering context for canvas.");
            throw new Error("Canvas context not available.");
        }
        this.ctx = context;

        this.handleSocketMessage = this.handleSocketMessage.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.draw = this.draw.bind(this)

        this.setupUIEventListeners();

        if (window.ft_socket) {
            window.ft_socket.addEventListener('message', this.handleSocketMessage);
        } else {
            console.error("[PongService] window.ft_socket is not initialized when PongService is constructed.");
        }
    }

    private getCurrentLobbyIdFromUrl(): string {
        const match = window.location.pathname.match(/\/pong\/([^/]+)/);
        return match?.[1] || '';
    }

    private handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);
        const currentUrlLobbyId = this.getCurrentLobbyIdFromUrl();
        console.log("frontend received: " + data.type);

        if (data.lobbyId !== currentUrlLobbyId) {
            console.log(`[PongService] Ignoring message for lobby ${data.lobbyId}, current is ${currentUrlLobbyId}`);
            return;
        }

        switch (data.type) {
            case 'gameJoined':
                this.gameState = data.gameState!;
                this.player1 = data.player1!;
                this.player2 = data.player2!;

                // Identify which player this client is
                // const currentUser = await UserService.getCurrentUser();
                // this.playerUserId = currentUser.id;
                // if (this.playerUserId === this.player1.userId) {
                //     this.isPlayer1Paddle = true;
                //     this.isPlayer2Paddle = false;
                //     console.log(`[PongService] Identified as Player 1 (User ID: ${this.playerUserId})`);
                // } else if (this.playerUserId === this.player2.userId) {
                //     this.isPlayer1Paddle = false;
                //     this.isPlayer2Paddle = true;
                //     console.log(`[PongService] Identified as Player 2 (User ID: ${this.playerUserId})`);
                // } else {
                //     console.warn(`[PongService] Current user ID ${this.playerUserId} is neither Player 1 nor Player 2 in this game.`);
                // }

                this.draw(); // Initial draw of the game state
                if (window.messageHandler && currentUrlLobbyId) {
                    window.messageHandler.startGame(currentUrlLobbyId);
                }
                break;

            case 'gameUpdate':
                this.gameState = data.gameState!;
                this.draw();
                break;

            case 'gameStarted':
                // Optional: handle any specific UI changes when game officially starts
                console.log("[PongService] Game started message received.");
                // No need to redraw here if gameUpdate will immediately follow
                break;

            default:
                console.warn("[PongService] Unhandled server message type:", data.type);
                break;
        }
    }

    private setupUIEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.playerUserId || !this.gameState || this.gameState.gameIsOver || this.gameState.paused) {
            return;
        }

        let direction: IPaddleDirection | null = null;

        if (event.key === 'w' || event.key === 'W') {
            if (!this.wPressed) {
                this.wPressed = true;
                direction = 'up';
            }
        } else if (event.key === 's' || event.key === 'S') {
            if (!this.sPressed) {
                this.sPressed = true;
                direction = 'down';
            }
        }

        if (direction && window.messageHandler) {
            if (this.isPlayer1Paddle || this.isPlayer2Paddle) {
                window.messageHandler.movePaddle(this.playerUserId, direction);
            }
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        if (event.key === 'w' || event.key === 'W') {
            this.wPressed = false;
        } else if (event.key === 's' || event.key === 'S') {
            this.sPressed = false;
        }
    }

    private draw(): void {
        if (!this.ctx || !this.gameState) {
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

        // if (this.gameState.paused) {
        //     this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
        // } else if (this.gameState.gameIsOver) {
        //     this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2);
        //     let winnerText = "";
        //     if (this.gameState.score1 > this.gameState.score2) {
        //         winnerText = `Player 1 Wins!`;
        //     } else if (this.gameState.score2 > this.gameState.score1) {
        //         winnerText = `Player 2 Wins!`;
        //     } else {
        //         winnerText = `It's a Draw!`;
        //     }
        //     this.ctx.fillText(winnerText, this.canvas.width / 2, this.canvas.height / 2 + 40);
        //     this.ctx.fillText(`Final Score: ${this.gameState.score1} - ${this.gameState.score2}`, this.canvas.width / 2, this.canvas.height / 2 + 80);
        // }
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

    public destroy(): void {
        // Remove all event listeners to prevent memory leaks and unintended behavior
        if (window.ft_socket) {
            window.ft_socket.removeEventListener('message', this.handleSocketMessage);
        }
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        console.log('[PongService] Destroyed. All event listeners removed.');
    }
}
