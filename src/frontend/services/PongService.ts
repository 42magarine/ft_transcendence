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
    private playerOneNameTag!: HTMLElement;
    private playerTwoNameTag!: HTMLElement;

    private wPressed: boolean = false;
    private sPressed: boolean = false;

    private animationFrameId: number | null = null;
    private countdownActive: boolean = false;

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

        this.playerOneNameTag = document.getElementById("playerOneNameTag") as HTMLElement;
        if (!this.playerOneNameTag) {
            console.error("[PongService] Could not find playerOneNameTag element.");
            throw new Error("playerOneNameTag element not found.");
        }

        this.playerTwoNameTag = document.getElementById("playerTwoNameTag") as HTMLElement;
        if (!this.playerTwoNameTag) {
            console.error("[PongService] Could not find playerTwoNameTag element.");
            throw new Error("playerTwoNameTag element not found.");
        }

        this.ctx = ctx;

        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);

        // Start with player vs player screen
        this.showPlayerVsPlayerScreen();
    }

    private showPlayerVsPlayerScreen(): void {
        this.overlay.classList.add("vs-screen");

        const vsContainer = document.createElement('div');
        vsContainer.className = 'vs-container';

        const player1Name = document.createElement('div');
        player1Name.textContent = this.player1?.userName || 'Player 1';
        this.playerOneNameTag.innerText = player1Name.textContent;
        player1Name.className = 'player-name player1';

        const vsText = document.createElement('div');
        vsText.textContent = 'VS';
        vsText.className = 'vs-text';

        const player2Name = document.createElement('div');
        player2Name.textContent = this.player2?.userName || 'Player 2';
        this.playerTwoNameTag.innerText = player2Name.textContent;
        player2Name.className = 'player-name player2';

        this.overlay.textContent = '';
        vsContainer.appendChild(player1Name);
        vsContainer.appendChild(vsText);
        vsContainer.appendChild(player2Name);
        this.overlay.appendChild(vsContainer);

        setTimeout(() => {
            this.overlay.classList.remove("vs-screen");
            if (!this.overlay.classList.contains("terminated")) {
                this.overlay.classList.add("third");
                this.countdownActive = true;
                this.startCountdown();
            }
        }, 4000);
    }

    private startCountdown(): void {
        let countdown = 3;
        this.overlay.textContent = countdown.toString();
        const timer = setInterval(() => {
            countdown--;
            if (this.overlay.classList.contains('terminated')) {
                this.countdownActive = false;
                clearInterval(timer);
                return;
            }
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
                this.countdownActive = false;
            } else {
                this.overlay.classList.add("hidden");
                this.countdownActive = false;
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

        switch (data.type) {
            case 'gameJoined':
                this.gameState = data.gameState!;
                this.player1 = data.player1!;
                this.player2 = data.player2!;

                if (window.currentUser?.id === this.player1.userId) {
                    this.isPlayer1Paddle = true;
                    this.isPlayer2Paddle = false;
                }
                else if (window.currentUser?.id === this.player2.userId) {
                    this.isPlayer1Paddle = false;
                    this.isPlayer2Paddle = true;
                }

                if (this.animationFrameId === null) {
                    this.clientLoop();
                }

                setTimeout(function () {
                    if (window.messageHandler && currentUrlLobbyId) {
                        window.messageHandler.startGame(currentUrlLobbyId);
                    }
                }, 8000) // Changed from 4000 to 8000 to account for the 4s vs screen + 4s countdown
                break;

            case 'gameUpdate':
                this.gameState = data.gameState!;
                this.draw(); // Das bleibt

                if (!this.gameState.paused && !this.gameState.gameIsOver && this.animationFrameId === null) {
                    this.clientLoop();
                }
                // NEU: Wenn das Spiel vorbei ist, stoppe die Loop explizit
                else if (this.gameState.gameIsOver && this.animationFrameId !== null) {
                    cancelAnimationFrame(this.animationFrameId);
                    this.animationFrameId = null;
                }
                break;
            case "playerLeft":
                if (this.countdownActive) {
                    this.overlay.classList.remove("first", "second", "third", "vs-screen", "ready");
                    this.overlay.classList.add("terminated");

                    const terminatedText = document.createElement('div');
                    terminatedText.textContent = 'Terminated by Opponent';
                    terminatedText.className = 'overlay-title';

                    const redirectSpan = document.createElement('div');
                    redirectSpan.textContent = 'you will be redirected';
                    redirectSpan.className = 'overlay-text';

                    this.overlay.textContent = '';
                    this.overlay.appendChild(terminatedText);
                    this.overlay.appendChild(redirectSpan);

                    this.countdownActive = false;
                } else if (!this.gameState.gameIsOver) {
                    this.overlay.classList.remove("first", "second", "third", "vs-screen", "ready");
                    this.overlay.classList.add("terminated");

                    const terminatedText = document.createElement('div');
                    terminatedText.textContent = 'Terminated by Opponent';
                    terminatedText.className = 'overlay-title';

                    const redirectSpan = document.createElement('div');
                    redirectSpan.textContent = 'you will be redirected';
                    redirectSpan.className = 'overlay-text';

                    this.overlay.textContent = '';
                    this.overlay.appendChild(terminatedText);
                    this.overlay.appendChild(redirectSpan);
                }

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
        if (this.overlay.classList.contains("terminated")) {
            return;
        }

        if (!this.overlay.classList.contains("terminated")) {
            this.overlay.classList.remove("ready");
            this.overlay.classList.add("hidden")
        }
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

        if (this.gameState.gameIsOver && !this.overlay.classList.contains("terminated")) {
            let winMsg = "";

            if (this.gameState.winnerName) {
                winMsg = this.gameState.winnerName + ` wins`;
                this.overlay.classList.remove("hidden");
                this.overlay.classList.add("game-over");

                const gameOverText = document.createElement('div');
                gameOverText.textContent = 'Game Over';
                gameOverText.className = 'overlay-title';

                const wins = document.createElement('div');
                wins.textContent = winMsg;
                wins.className = 'overlay-text';

                const scores = document.createElement('div');
                scores.textContent = 'Final Score: ' + this.gameState.score1 + ' - ' + this.gameState.score2;
                scores.className = 'overlay-text';

                const finishBtn = document.createElement('button');
                finishBtn.textContent = "Back to Lobbies";
                finishBtn.className = 'btn btn-primary';
                finishBtn.id = 'btnGameLeave';
                finishBtn.onclick = () => { Router.redirect("/lobbylist") };

                this.overlay.textContent = '';
                this.overlay.appendChild(gameOverText);
                this.overlay.appendChild(wins);
                this.overlay.appendChild(scores);
                this.overlay.appendChild(finishBtn);
            }
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
