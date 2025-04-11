import { PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_MOVE_SPEED } from "../types/constants.js";

export class Paddle {
    private x: number;
    private y: number;
    private height: number;
    private width: number;
    private movespeed: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.height = PADDLE_HEIGHT;
        this.width = PADDLE_WIDTH;
        this.movespeed = PADDLE_MOVE_SPEED;
    }

    public moveUp(): void {
        this.y -= this.movespeed;
    }

    public moveDown(): void {
        this.y += this.movespeed;
    }

    // Getters
    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    public getHeight(): number {
        return this.height;
    }

    public getWidth(): number {
        return this.width;
    }

    public getMoveSpeed(): number {
        return this.movespeed;
    }

    // Setters
    public setX(x: number): void {
        this.x = x;
    }

    public setY(y: number): void {
        this.y = y;
    }

    public setHeight(height: number): void {
        this.height = height;
    }

    public setWidth(width: number): void {
        this.width = width;
    }

    public setMoveSpeed(speed: number): void {
        this.movespeed = speed;
    }
}

