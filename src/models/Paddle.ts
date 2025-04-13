import {
    PADDLE_WIDTH,
    PADDLE_HEIGHT,
    PADDLE_MOVE_SPEED,
} from "../types/constants.js";

export class Paddle {
    private _x: number;
    private _y: number;
    private _height: number;
    private _width: number;
    private _movespeed: number;

    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
        this._height = PADDLE_HEIGHT;
        this._width = PADDLE_WIDTH;
        this._movespeed = PADDLE_MOVE_SPEED;
    }

    public moveUp(): void {
        this._y -= this._movespeed;
    }

    public moveDown(): void {
        this._y += this._movespeed;
    }

    // Getters
    public get x(): number {
        return this._x;
    }

    public get y(): number {
        return this._y;
    }

    public get height(): number {
        return this._height;
    }

    public get width(): number {
        return this._width;
    }

    public get movespeed(): number {
        return this._movespeed;
    }

    // Setters
    public set x(value: number) {
        this._x = value;
    }

    public set y(value: number) {
        this._y = value;
    }

    public set height(value: number) {
        this._height = value;
    }

    public set width(value: number) {
        this._width = value;
    }

    public set movespeed(value: number) {
        this._movespeed = value;
    }
}
