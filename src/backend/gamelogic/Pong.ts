import { Ball } from "../gamelogic/components/Ball.js";
import { Paddle } from "../gamelogic/components/Paddle.js";
import { Player } from "../gamelogic/components/Player.js";
import { IGameState, IPaddleDirection } from "../../interfaces/interfaces.js";
import { IServerMessage } from "../../interfaces/interfaces.js";
import { GAME_WIDTH, GAME_HEIGHT, STEPS, SCORE_LIMIT } from "../../types/constants.js";
import { MatchService } from "../services/MatchService.js";

export class PongGame {
    private _width: number;
    private _height: number;
    private _ball: Ball;
    private _paddle1: Paddle;
    private _paddle2: Paddle;
    private _score1: number = 0;
    private _score2: number = 0;
    public _scoreLimit: number;
    private _paused: boolean = true;
    private _running: boolean = false;
    private _gameIsOver: boolean = false;
    private _intervalId: NodeJS.Timeout | null = null;
    private _gameId: number | null = null;
    private _player1: Player | null = null;
    private _player2: Player | null = null;
    private _player1Left: boolean = false;
    private _player2Left: boolean = false;
    private _winner: Player | null = null;
    private _gameService?: MatchService;
    private _broadcast: (data: IServerMessage) => void;

    constructor(broadcast: (data: IServerMessage) => void,
        gameService?: MatchService,
    ) {
        this._width = GAME_WIDTH;
        this._height = GAME_HEIGHT;
        this._ball = new Ball(this._width / 2, this._height / 2, 4, 4);
        this._paddle1 = new Paddle(10, this._height / 2 - 50);
        this._paddle2 = new Paddle(this._width - 20, this._height / 2 - 50);
        this._scoreLimit = SCORE_LIMIT;
        this._gameService = gameService;
        this._broadcast = broadcast;
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
            this.checkWin();
            this._broadcast({
                type: "gameUpdate",
                gameState: this.getState()
            });
        }, 1000 / 60);
    }

    public checkWin(): void {
        if (this._gameIsOver) {
            if (this._player1Left) {
                this._winner = this.player2;
            }
            if (this._player2Left) {
                this._winner = this.player1;
            }
            this.updateGameRecord();
            this.stopGameLoop();
        }
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
        this._ball.randomizeDirection();
        //this._paddle1 = new Paddle(10, this._height / 2 - 50);
        //this._paddle2 = new Paddle(this._width - 20, this._height / 2 - 50);
    }

    public resetScores(): void {
        this._score1 = 0;
        this._score2 = 0;
        this._gameIsOver = false;
    }

    private async updateGameRecord() {
        if (this._gameService && this._gameId) {
            try {
                const WinnerId = this._score1 > this._score2 ? this._player1?.userId : this._player2?.userId;

                await this._gameService.updateScore(
                    this._gameId,
                    this._score1,
                    this._score2,
                    this._winner?.userId
                );
            } catch (error) {
                console.error("Failed to update db", error)
            }
        }
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
                    this._gameIsOver = true;
                    this._winner = this.player2;
                }
                else {
                    this.resetGame();
                }
                break;
            }
            else if (ballX > this._width) {
                this._score1++;
                if (this._score1 >= this._scoreLimit) {
                    this._gameIsOver = true;
                    this._winner = this.player1;
                }
                else {
                    this.resetGame();
                }
                break;
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

    public movePaddle(requestingUserId: number, direction: IPaddleDirection): void {
        let paddleToMove: Paddle | null = null;

        if (this._player1 && this._player1.userId === requestingUserId) {
            paddleToMove = this._paddle1;
        } else if (this._player2 && this._player2.userId === requestingUserId) {
            paddleToMove = this._paddle2;
        }

        if (!paddleToMove) {
            console.warn(`movePaddle: User ID ${requestingUserId} is not a player in this game.`);
            return;
        }


        if (direction === "up") {
            paddleToMove.moveUp();
            if (paddleToMove.y < 0) paddleToMove.y = 0;
        }
        else if (direction === "down") {
            paddleToMove.moveDown();
            if (paddleToMove.y + paddleToMove.height > this._height) paddleToMove.y = this._height - paddleToMove.height; // Prevent going below bottom
        }
    }

    public setPlayer(playerNumber: number, player: Player) {
        if (playerNumber === 1) {
            this._player1 = player
        }
        else if (playerNumber === 2) {
            this._player2 = player
        }
    }

    public removePlayer(playerNumber: number): void {
        if (playerNumber === 1) {
            this._player1 = null;
        }
        else if (playerNumber === 2) {
            this._player2 = null;
        }
    }

    public getState(): IGameState {
        return {
            ball: {
                x: this._ball.x,
                y: this._ball.y,
                radius: this._ball.radius,
                speedX: this._ball.speedX,
                speedY: this._ball.speedY
            },
            paddle1: {
                x: this._paddle1.x,
                y: this._paddle1.y,
                width: this._paddle1.width,
                height: this._paddle1.height
            },
            paddle2: {
                x: this._paddle2.x,
                y: this._paddle2.y,
                width: this._paddle2.width,
                height: this._paddle2.height
            },
            score1: this._score1,
            score2: this._score2,
            paused: this._paused,
            running: this._running,
            gameIsOver: this._gameIsOver,
            player1Left: this.player1Left,
            player2Left: this.player2Left,
            winnerName: this._winner?._name,
        };
    }

    public get score1(): number {
        return this._score1;
    }

    public get score2(): number {
        return this._score2;
    }

    public get isRunning(): boolean {
        return this._running;
    }

    public get isPaused(): boolean {
        return this._paused;
    }

    public get player1(): Player | null {
        return this._player1;
    }

    public get player2(): Player | null {
        return this._player2;
    }

    public get isGameOver(): boolean {
        return this._gameIsOver;
    }

    public set score1(score: number) {
        this._score1 = score;
    }

    public set score2(score: number) {
        this._score2 = score;
    }

    public set isRunning(state: boolean) {
        this._running = state;
    }

    public set isPaused(state: boolean) {
        this._paused = state;
    }

    public set isGameOver(state: boolean) {
        this._gameIsOver = state;
    }

    public set player1Left(state: boolean) {
        this._player1Left = state;
    }

    public set player2Left(state: boolean) {
        this._player2Left = state;
    }
}
