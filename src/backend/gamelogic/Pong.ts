import { Ball } from "../gamelogic/components/Ball.js";
import { Paddle } from "../gamelogic/components/Paddle.js";
import { Player } from "../gamelogic/components/Player.js";
import { IGameState, IPaddleDirection } from "../../interfaces/interfaces.js";
import { ServerMessage } from "../../interfaces/interfaces.js";
import { GAME_WIDTH, GAME_HEIGHT, STEPS, SCORE_LIMIT } from "../../types/constants.js";
import { GameService } from "../services/GameService.js";

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
    private _gameService?: GameService;

    constructor(gameService?: GameService) {
        this._width = GAME_WIDTH;
        this._height = GAME_HEIGHT;
        this._ball = new Ball(this._width / 2, this._height / 2, 4, 4);
        this._paddle1 = new Paddle(10, this._height / 2 - 50);
        this._paddle2 = new Paddle(this._width - 20, this._height / 2 - 50);
        this._scoreLimit = SCORE_LIMIT;
        this._gameService = gameService;
    }

    public startGameLoop(broadcast: (data: ServerMessage) => void): void {
        if (this._running) return;

        this._running = true;
        this._paused = false;

        this.createGameRecord();

        this._intervalId = setInterval(() => {
            if (this._paused) return;

            this.update();
            broadcast({
                type: "gameUpdate",
                state: this.getState()
            });

            if (this._gameIsOver) {
                this.updateGameRecord();
                this.stopGameLoop();
            }
        }, 1000 / 60);
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
        this._paddle1 = new Paddle(10, this._height / 2 - 50);
        this._paddle2 = new Paddle(this._width - 20, this._height / 2 - 50);
    }

    public resetScores(): void {
        this._score1 = 0;
        this._score2 = 0;
        this._gameIsOver = false;
    }

    private async createGameRecord() {
        if (this._gameService && this._player1?.userId && this._player2?.userId) {
            try {
                const game = await this._gameService.createGame(
                    this._player1.userId,
                    this._player2.userId
                );
                this._gameId = game.id;
            } catch (error) {
                console.error("Failed to create game record:", error)
            }
        }
    }

    private async updateGameRecord() {
        if (this._gameService && this._gameId) {
            try {
                const WinnerId = this._score1 > this._score2 ? this._player1?.userId : this._player2?.userId;

                await this._gameService.updateGameScore(
                    this._gameId,
                    this._score1,
                    this._score2,
                    WinnerId || undefined
                );
            } catch (error) {
                console.error("Failed to update db", error)
            }
        }
    }

    private endGame(winner: number): void {
        // Call a callback, emit event, or flag the game state
        this._gameIsOver = true;
        console.log(`Player ${winner} wins!`);
        // Optionally notify controller or set state for frontend sync
    }

    public pauseGame(): void {
        this._paused = true;
    }

    public resumeGame(): void {
        this._paused = false;
    }

    public update(): void {
        if (this._paused || this._gameIsOver) {
            return;
        }

        for (let i = 0; i < STEPS; i++) {
            this._ball.update();

            const ballY = this._ball.y;
            const ballX = this._ball.x;

            if (ballY <= 0 || ballY >= this._height) {
                this._ball.revY();
            }

            if (this.isColliding(this._ball, this._paddle1)) {
                const paddleCenterY = this._paddle1.y + this._paddle1.height / 2;
                const overlapY = ballY - paddleCenterY;
                this._ball.revX();
                this._ball.speedY += overlapY * 0.05;
            } else if (this.isColliding(this._ball, this._paddle2)) {
                const paddleCenterY = this._paddle2.y + this._paddle2.height / 2;
                const overlapY = ballY - paddleCenterY;
                this._ball.revX();
                this._ball.speedY += overlapY * 0.05;
            }

            if (ballX < 0) {
                this._score2++;
                if (this._score2 >= this._scoreLimit) {
                    this.endGame(2)
                }
                else {
                    this.resetGame();
                }
                break;
            } else if (ballX > this._width) {
                this._score1++;
                if (this._score1 >= this._scoreLimit) {
                    this.endGame(1)
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

    public movePaddle(player: Player, direction: IPaddleDirection): void {
        const paddle = player.id === 1 ? this._paddle1 : this._paddle2;

        if (direction === "up" && paddle.y > 0) {
            paddle.moveUp();
        } else if (direction === "down" && paddle.y + paddle.height < this._height) {
            paddle.moveDown();
        }
    }

    public setPlayer(playerNum: 1 | 2, player: Player) {
        if (playerNum === 1) {
            this._player1 = player
        }
        else {
            this._player2 = player
        }
    }

    public getState(): IGameState {
        return {
            ball: {
                x: this._ball.x,
                y: this._ball.y,
                radius: this._ball.radius
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
            gameIsOver: this._gameIsOver
        };
    }

    // Getters/Setters
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
}
