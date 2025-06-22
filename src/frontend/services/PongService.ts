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
        this.canvas.width = 800;
        this.canvas.height = 600;


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
        if (!this.playerOneNameTag) {
            new Modal().renderInfoModal({
                id: "missing-player1",
                title: "Player 1 Tag Missing",
                message: "Could not find Player 1 name tag element in the DOM."
            });
            return;
        }

        this.playerTwoNameTag = document.getElementById("playerTwoNameTag") as HTMLElement;
        if (!this.playerTwoNameTag) {
            new Modal().renderInfoModal({
                id: "missing-player2",
                title: "Player 2 Tag Missing",
                message: "Could not find Player 2 name tag element in the DOM."
            });
            return;
        }

        this.ctx = ctx;

        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        // let countdown = 3;
        // this.overlay.textContent = countdown.toString();
        // const timer = setInterval(() => {
        //     countdown--;

        //     if (countdown == 3) {
        //         this.overlay.classList.add("third");
        //         this.overlay.textContent = countdown.toString();
        //     } else if (countdown == 2) {
        //         this.overlay.classList.remove("third");
        //         this.overlay.classList.add("second");
        //         this.overlay.textContent = countdown.toString();
        //     } else if (countdown == 1) {
        //         this.overlay.classList.remove("second");
        //         this.overlay.classList.add("first");
        //         this.overlay.textContent = countdown.toString();
        //     } else if (countdown === 0) {
        //         this.overlay.classList.remove("first");
        //         this.overlay.classList.add("ready");
        //         this.overlay.textContent = 'START!';
        //     } else {
        //         this.overlay.style.display = 'none';
        //         clearInterval(timer);
        //     }
        // }, 1000);

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
                // console.log("playerjoined case reached. handed over info: ", data);
                if (data.matchId?.toString() === matchId) {

                    this.gameState = data.gameState!;
                    this.player1Name = data.player1Name!;
                    this.player2Name = data.player2Name!;
                    {
                        // console.log("window current user:", window.currentUser?.id, " window gamestate player1id", this.gameState.player1Id)
                        // console.log("window current user:", window.currentUser?.id, " window gamestate player2id", this.gameState.player2Id)
                        if (window.currentUser?.name === data.player1Name) {
                            console.log("paddle1")
                            this.isPlayer1Paddle = true;
                            this.isPlayer2Paddle = false;
                            // console.log(`[PongService] Identified as Player 1 (User ID: ${window.currentUser?.id})`);
                        }
                        else if (window.currentUser?.name === data.player2Name) {
                            console.log("paddle2")
                            this.isPlayer1Paddle = false;
                            this.isPlayer2Paddle = true;
                            // console.log(`[PongService] Identified as Player 2 (User ID: ${window.currentUser?.id})`);
                        }
                        // else {
                        //     this.isPlayer1Paddle = false;
                        //     this.isPlayer2Paddle = false;
                        //     console.log(`[PongService] Current user ID ${window.currentUser?.id} is neither Player 1 nor Player 2 in this game.`);
                        // }
                    }
                }
                if (this.animationFrameId === null) {
                    console.log("paddle loop")
                    this.clientLoop();
                }
                break;

            case 'gameStateUpdate':
                if (data.activeGamesStates && Array.isArray(data.activeGamesStates)) {
                    // console.log('Received gameStateUpdate. Looking for matchId:', this.matchId, 'in states:', data.activeGamesStates)
                    const relevantGameState = data.activeGamesStates.find(gs => gs.matchId === this.matchId)
                    // console.log('found relevantGameState:', relevantGameState);
                    if (relevantGameState) {
                        this.gameState = relevantGameState;
                        this.draw();
                        if (!this.gameState.paused && !this.gameState.gameIsOver && this.animationFrameId === null) {
                            this.clientLoop();
                        }
                    }
                }
                // NEU: Wenn das Spiel vorbei ist, stoppe die Loop explizit
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
            if (this.isPlayer1Paddle || this.isPlayer2Paddle) {
                let playerNumber: number;
                if (this.player1Name === window.currentUser.name) {
                    playerNumber = 1;
                } else if (this.player2Name === window.currentUser.name) {
                    playerNumber = 2;
                }
                window.messageHandler.movePaddle(window.currentUser?.id, this.matchId, playerNumber!, direction);
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

    public getGameState(): IGameState {
        return this.gameState;
    }

    public getPlayer1Name(): string{
        return this.player1Name;
    }

    public getPlayer2Name(): string {
        return this.player2Name;
    }
}
