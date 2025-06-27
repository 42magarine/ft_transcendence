import { match } from 'assert';
import { IServerMessage, IPaddleDirection, IGameState, IPlayerState } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';
import Modal from '../components/Modal.js'

export default class PongService {
    private gameState!: IGameState;
    private player1Name!: string;
    private player2Name!: string;
    private isPlayer1Paddle: boolean = false;
    private isPlayer2Paddle: boolean = false;
    private matchId: number | null = null;

    private gameWinMessage!: string;
    private gameScoreMessage!: string;
    private canvas!: HTMLCanvasElement;
    private overlay!: HTMLElement;
    private ctx!: CanvasRenderingContext2D;
    private playerOneNameTag!: HTMLElement;
    private playerTwoNameTag!: HTMLElement;

    private wPressed: boolean = false;
    private sPressed: boolean = false;

    private animationFrameId: number | null = null;
    private countdownActive: boolean = false;

    // Gebundene Event Handler für korrektes Cleanup
    private boundHandleKeyDown: (event: KeyboardEvent) => void;
    private boundHandleKeyUp: (event: KeyboardEvent) => void;

    constructor() {
        this.handleSocketMessage = this.handleSocketMessage.bind(this);
        this.draw = this.draw.bind(this);
        this.clientLoop = this.clientLoop.bind(this);

        // Binde die Keyboard Handler einmal im Constructor
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleKeyUp = this.handleKeyUp.bind(this);
    }

    public initializeGame(
        matchId: number,
    ) {
        const canvasElement = document.getElementById('gameCanvas') as HTMLCanvasElement
        if (!canvasElement) {
            new Modal().renderInfoModal({
                id: "missing-canvas-element",
                title: "Canvas Missing",
                message: "The canvas element could not be found during game initialization."
            });
        }
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.matchId = matchId;
        // console.log("pongService matchId: ", this.matchId)

        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.overlay = document.getElementById('gameCanvasWrap-overlay') as HTMLElement;
        // console.log(this.overlay);
        if (!this.overlay) {
            new Modal().renderInfoModal({
                id: "missing-overlay",
                title: "Overlay Error",
                message: "PongService: Game overlay element not found."
            });
            return;
        }
    }

    public setupEventListener(): void {
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        if (!this.canvas) {
            new Modal().renderInfoModal({
                id: "missing-gameCanvas",
                title: "Canvas Error",
                message: "PongService could not find the gameCanvas element."
            });
        }

        this.overlay = document.getElementById("gameCanvasWrap-overlay") as HTMLElement;
        if (!this.overlay) {
            new Modal().renderInfoModal({
                id: "missing-overlay",
                title: "Overlay Missing",
                message: "Overlay element for the game not found."
            });
        }

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            new Modal().renderInfoModal({
                id: "canvas-context-error",
                title: "Rendering Error",
                message: "Could not get 2D rendering context for the canvas."
            });
            return;
        }

        this.playerOneNameTag = document.getElementById("playerOneNameTag") as HTMLElement;
        this.playerTwoNameTag = document.getElementById("playerTwoNameTag") as HTMLElement;
        this.ctx = ctx;

        // Verwende die gebundenen Handler
        document.addEventListener('keydown', this.boundHandleKeyDown);
        document.addEventListener('keyup', this.boundHandleKeyUp);
    }

    private getCurrentLobbyIdFromUrl(): string {
        const match = window.location.pathname.match(/\/pong\/([^/]+)/);
        return match?.[1] || '';
    }

    private getMatchId(): string {
        const match = window.location.pathname.match(/\/([^\/]+)\/?$/);
        return match?.[1] || '';
    }

    public handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);
        const currentUrlLobbyId = this.getCurrentLobbyIdFromUrl();
        const matchId = this.getMatchId();
        switch (data.type) {
            case 'initMatchStart':
                if (data.matchId?.toString() === matchId) {

                    this.gameState = data.gameState!;
                    this.player1Name = data.player1Name!;
                    this.player2Name = data.player2Name!;
                    {
                        if (window.currentUser?.username === data.player1Name) {
                            this.isPlayer1Paddle = true;
                            this.isPlayer2Paddle = false;
                        }
                        else if (window.currentUser?.username === data.player2Name) {
                            this.isPlayer1Paddle = false;
                            this.isPlayer2Paddle = true;
                        }
                    }
                }
                if (this.animationFrameId === null) {
                    this.clientLoop();
                }
                break;

            case 'gameStateUpdate':
                if (data.activeGamesStates && Array.isArray(data.activeGamesStates)) {
                    const relevantGameState = data.activeGamesStates.find(gs => gs.matchId === this.matchId)
                    if (relevantGameState) {
                        this.gameState = relevantGameState;
                        this.draw();
                        if (!this.gameState.paused && !this.gameState.gameIsOver && this.animationFrameId === null) {
                            this.clientLoop();
                        }
                    }
                }
                else if (this.gameState.gameIsOver && this.animationFrameId !== null) {
                    cancelAnimationFrame(this.animationFrameId);
                    this.animationFrameId = null;
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
            case 'gameOver':
                if (data.lobby?.lobbyType == 'game') {
                    if (data.player1Name === window.currentUser?.name || data.player2Name === window.currentUser?.name) {
                        if (data.player1Score! > data.player2Score!) {
                            this.gameWinMessage = data.player1Name + " won against " + data.player2Name
                            this.gameScoreMessage = "Score: " + data.player1Score + " : " + data.player2Score
                        }
                        else if (data.player2Score! > data.player1Score!) {
                            this.gameWinMessage = data.player2Name + " won against " + data.player1Name
                            this.gameScoreMessage = "Score: " + data.player2Score + " : " + data.player1Score
                        } else {
                            this.gameWinMessage = "Its a tie! How do you even tie in Pong?";
                            this.gameScoreMessage = " ";
                        }
                        Router.redirect("/gameover");
                        setTimeout(() => {
                            if (/\/gameover/.test(window.location.pathname)) {
                                Router.redirect('/lobbylist');
                            }
                        }, 15000);
                    }
                }
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

        if (direction && window.messageHandler && this.matchId) {
            let playerNumber: number | undefined;

            // Bestimme die Spielernummer basierend auf den Flags
            if (this.isPlayer1Paddle) {
                playerNumber = 1;
            } else if (this.isPlayer2Paddle) {
                playerNumber = 2;
            }

            // Nur senden wenn playerNumber gültig ist
            if (playerNumber && window.currentUser?.id) {
                window.messageHandler.movePaddle(window.currentUser.id, this.matchId, playerNumber, direction);
            }
        }

        this.animationFrameId = requestAnimationFrame(this.clientLoop);
    }

    private handleKeyDown(event: KeyboardEvent): void {
        // Don't hijack keys when typing in form fields
        const target = event.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            return;
        }

        if (!window.currentUser?.id || !this.gameState || this.gameState.gameIsOver || this.gameState.paused) {
            return;
        }

        // preventDefault für Game-Tasten hinzufügen
        const gameKeys = ['w', 'arrowup', 's', 'arrowdown'];
        if (gameKeys.includes(event.key.toLowerCase())) {
            event.preventDefault();
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
        const target = event.target as HTMLElement;

        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            return;
        }

        // preventDefault für Game-Tasten hinzufügen
        const gameKeys = ['w', 'arrowup', 's', 'arrowdown'];
        if (gameKeys.includes(event.key.toLowerCase())) {
            event.preventDefault();
        }

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
        if (!this.ctx || !this.canvas || !this.gameState) {
            new Modal().renderInfoModal({
                id: "draw-error",
                title: "Drawing Error",
                message: "Context, canvas, or game state is missing. Unable to draw."
            });
            return;
        }


        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);


        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.overlay) {
            if (this.gameState.paused || this.gameState.gameIsOver) {
                this.overlay.classList.remove("hidden");
                this.overlay.textContent = this.gameState.paused ? 'Paused' : 'Game Over';
            } else {
                this.overlay.classList.remove("ready");
                this.overlay.classList.add("hidden");
            }
        }
        this.ctx.fillStyle = 'white';

        this.ctx.fillRect(this.gameState.paddle1.x, this.gameState.paddle1.y, this.gameState.paddle1.width, this.gameState.paddle1.height);
        this.ctx.fillRect(this.gameState.paddle2.x, this.gameState.paddle2.y, this.gameState.paddle2.width, this.gameState.paddle2.height);

        this.ctx.beginPath();
        this.ctx.arc(this.gameState.ball.x, this.gameState.ball.y, this.gameState.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
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
            this.ctx.fillStyle = 'red';
            this.ctx.font = '60px Arial';
            this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2);
            let winMsg = "";
            if (this.gameState.score1 > this.gameState.score2) {
                winMsg = this.player1Name + ` wins`;
            } else if (this.gameState.score2 > this.gameState.score1) {
                winMsg = this.player2Name + ` wins`;
            } else {
                winMsg = "It's a draw!";
            }
            this.ctx.font = '30px Arial';
            this.ctx.fillText(winMsg, this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Final Score: ${this.gameState.score1} - ${this.gameState.score2}`, this.canvas.width / 2, this.canvas.height / 2 + 80);
        }
    }

    public cleanup(): void {
        document.removeEventListener('keydown', this.boundHandleKeyDown);
        document.removeEventListener('keyup', this.boundHandleKeyUp);

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.wPressed = false;
        this.sPressed = false;

        this.isPlayer1Paddle = false;
        this.isPlayer2Paddle = false;

        this.matchId = null;
    }

    public getGameState(): IGameState {
        return this.gameState;
    }

    public getPlayer1Name(): string {
        return this.player1Name;
    }

    public getPlayer2Name(): string {
        return this.player2Name;
    }

    public getGameWinMessage(): string {
        return this.gameWinMessage;
    }

    public getGameScoreMessage(): string {
        return this.gameScoreMessage;
    }
}