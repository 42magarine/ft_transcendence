import { BALL_RADIUS, STEPSIZE } from "../types/constants.js";

export class Ball {
    private _x: number;
    private _y: number;
    private _speedX: number;
    private _speedY: number;
    private _radius: number;

    constructor(x: number, y: number, speedX: number, speedY: number) {
        this._x = x;
        this._y = y;
        this._speedX = speedX;
        this._speedY = speedY;
        this._radius = BALL_RADIUS;
    }

    public update(): void {
        this._x += this._speedX * STEPSIZE;
        this._y += this._speedY * STEPSIZE;
    }

    public revX(): void {
        this._speedX *= -1;
    }

    public revY(): void {
        this._speedY *= -1;
    }

    public randomizeDirection(): void {
        const randomXDirection = Math.random() > 0.5 ? 1 : -1;
        const randomYDirection = Math.random() > 0.5 ? 1 : -1;
        this._speedX *= randomXDirection;
        this._speedY *= randomYDirection;
    }

    // Getters and Setters

    public get x(): number {
        return this._x;
    }

    public set x(value: number) {
        this._x = value;
    }

    public get y(): number {
        return this._y;
    }

    public set y(value: number) {
        this._y = value;
    }

    public get speedX(): number {
        return this._speedX;
    }

    public set speedX(value: number) {
        this._speedX = value;
    }

    public get speedY(): number {
        return this._speedY;
    }

    public set speedY(value: number) {
        this._speedY = value;
    }

    public get radius(): number {
        return this._radius;
    }

    public set radius(value: number) {
        this._radius = value;
    }
}
