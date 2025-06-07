import { Ball } from "../gamelogic/components/Ball.js";
import { Paddle } from "../gamelogic/components/Paddle.js";
import { Player } from "../gamelogic/components/Player.js";
import { IBallState, IGameState, IPaddleDirection, IPaddleState } from "../../interfaces/interfaces.js";
import { IServerMessage } from "../../interfaces/interfaces.js";
import { GAME_WIDTH, GAME_HEIGHT, STEPS, SCORE_LIMIT } from "../../types/constants.js";
import { MatchService } from "../services/MatchService.js";

export class PongGame {
    private _width: number;
    private _height: number;
    private _ball: Ball;
    private _paddle1: Paddle;
    private _paddle2: Paddle;
    public _score1: number = 0;
    public _score2: number = 0;
    public _scoreLimit: number;
    private _paused: boolean = true;
    private _running: boolean = false;
    private _gameIsOver: boolean = false;
    private _intervalId: NodeJS.Timeout | null = null;
    private _matchId: number | null = null;
    public _player1: Player | null = null;
    public _player2: Player | null = null;
    private _gameService?: MatchService;
    private _onGameOverCallback: (matchId: number) => void; // Callback for MatchLobby

    constructor(onGameOverCallback: (matchId: number) => void) {
        this._width = GAME_WIDTH;
        this._height = GAME_HEIGHT;
        this._ball = new Ball(this._width / 2, this._height / 2, 4, 4);
        this._paddle1 = new Paddle(10, this._height / 2 - 50);
        this._paddle2 = new Paddle(this._width - 20, this._height / 2 - 50);
        this._scoreLimit = SCORE_LIMIT;
        this._onGameOverCallback = onGameOverCallback;
    }

    public startGameLoop(): void {
        if (this._running) {
            return;
        }

        this._running = true;
        this._paused = false;

        this._intervalId = setInterval(() => {
            if (this._paused) return;

            this.update();

            if (this._gameIsOver) {
                this.stopGameLoop();
                if (this._matchId !== null) {
                    this._onGameOverCallback(this._matchId); // Trigger callback on game over
                } else {
                    console.error("PongGame: Game over but matchId is null, cannot trigger callback.");
                }
            }
        }, 1000 / 60); // 60 frames per second
    }

    public stopGameLoop(): void {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        this._running = false;
    }

    public resetGame(): void {
        this._ball = new Ball(this._width / 2, this._height / 2, 4, 4);
        this._paddle1 = new Paddle(10, this._height / 2 - 50);
        this._paddle2 = new Paddle(this._width - 20, this._height / 2 - 50);
        this._gameIsOver = false; 
    }

    public resetScores(): void {
        this._score1 = 0;
        this._score2 = 0;
        this._gameIsOver = false;
    }

    private endGame(): void {
        this._gameIsOver = true;
    }

    public update(): void {
        if (this._paused || this._gameIsOver) {
            return;
        }

        for (let i = 0; i < STEPS; i++) {
            this._ball.update();

            const ballX = this._ball.x;
            const ballY = this._ball.y;
            const ballRadius = this._ball.radius;

            
            if (ballY - ballRadius <= 0) {
                this._ball.y = ballRadius;
                this._ball.revY();
            }
            else if (ballY + ballRadius >= this._height) {
                this._ball.y = this._height - ballRadius;
                this._ball.revY();
            }

            
            if (this._ball.speedX < 0 && this.isColliding(this._ball, this._paddle1)) {
                this._ball.x = this._paddle1.x + this._paddle1.width + ballRadius;
                this._ball.revX();
                const paddleCenterY = this._paddle1.y + this._paddle1.height / 2;
                const overlapY = ballY - paddleCenterY;
                this._ball.speedY += overlapY * 0.05;
            }
            else if (this._ball.speedX > 0 && this.isColliding(this._ball, this._paddle2)) {
                this._ball.x = this._paddle2.x - ballRadius;
                this._ball.revX();
                const paddleCenterY = this._paddle2.y + this._paddle2.height / 2;
                const overlapY = ballY - paddleCenterY;
                this._ball.speedY += overlapY * 0.05;
            }

            
            if (ballX < 0) {
                this._score2++;
                if (this._score2 >= this._scoreLimit) {
                    this.endGame();
                }
                else {
                    this.resetGame();
                }
                break; // Stop updating for this frame after a score
            }
            else if (ballX > this._width) {
                this._score1++;
                if (this._score1 >= this._scoreLimit) {
                    this.endGame();
                }
                else {
                    this.resetGame();
                }
                break; // Stop updating for this frame after a score
            }
        }
    }

    private isColliding(ball: Ball, paddle: Paddle): boolean {
        return (
            ball.x - ball.radius <= paddle.x + paddle.width &&
            ball.x + ball.radius >= paddle.x &&
            ball.y + ball.radius >= paddle.y &&
            ball.y - ball.radius <= paddle.y + paddle.height
        );
    }

    public movePaddle(playerNumber: number, direction: IPaddleDirection): void {
        let paddleToMove: Paddle | null = null;

        if (playerNumber === 1) {
            paddleToMove = this._paddle1;
        } else if (playerNumber === 2) {
            paddleToMove = this._paddle2;
        }

        if (!paddleToMove) {
            console.warn(`movePaddle: Player number ${playerNumber} is not active in this game.`);
            return;
        }

        if (direction === "up") {
            paddleToMove.moveUp();
            if (paddleToMove.y < 0) paddleToMove.y = 0;
        }
        else if (direction === "down") {
            paddleToMove.moveDown();
            if (paddleToMove.y + paddleToMove.height > this._height) paddleToMove.y = this._height - paddleToMove.height;
        }
    }

    public setPlayer(playerNumber: number, player: Player) {
        if (playerNumber === 1) {
            this._player1 = player;
        }
        else if (playerNumber === 2) {
            this._player2 = player;
        }
    }

    public clearPlayers(): void {
        this._player1 = null;
        this._player2 = null;
    }

    public setMatchId(matchId: number): void { 
        this._matchId = matchId;
    }

public getState(): IGameState {
        const ballState: IBallState = {
            x: this._ball.x,
            y: this._ball.y,
            radius: this._ball.radius,
            speedX: this._ball.speedX,
            speedY: this._ball.speedY
        };

        const paddle1State: IPaddleState = {
            x: this._paddle1.x,
            y: this._paddle1.y,
            width: this._paddle1.width,
            height: this._paddle1.height
        };

        const paddle2State: IPaddleState = {
            x: this._paddle2.x,
            y: this._paddle2.y,
            width: this._paddle2.width,
            height: this._paddle2.height
        };

        return {
            ball: ballState,
            paddle1: paddle1State,
            paddle2: paddle2State,
            score1: this._score1,
            score2: this._score2,
            paused: this._paused,
            running: this._running,
            gameIsOver: this._gameIsOver,
            matchId: this._matchId || undefined,
            player1Id: this._player1?.userId,
            player2Id: this._player2?.userId
        };
    }
}
