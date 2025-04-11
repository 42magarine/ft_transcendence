import { BALL_RADIUS, STEPSIZE } from "../types/constants.js";

export class Ball {
    private x: number;
    private y: number;
    private speedX: number;
    private speedY: number;
    private radius: number;

    constructor(x: number, y: number, speedX: number, speedY: number) {
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.radius = BALL_RADIUS;
    }

    public updateBall(): void {
        this.x += this.speedX * STEPSIZE;
        this.y += this.speedY * STEPSIZE;
    }

    public revX(): void {
        this.speedX *= -1;
    }

    public revY(): void {
        this.speedY *= -1;
    }

    public randomizeDirection(): void {
        const randomXDirection = Math.random() > 0.5 ? 1 : -1;
        const randomYDirection = Math.random() > 0.5 ? 1 : -1;
        this.speedX *= randomXDirection;
        this.speedY *= randomYDirection;
    }

    // Getters
    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    public getSpeedX(): number {
        return this.speedX;
    }

    public getSpeedY(): number {
        return this.speedY;
    }

    public getRadius(): number {
        return this.radius;
    }

    // Setters
    public setX(x: number): void {
        this.x = x;
    }

    public setY(y: number): void {
        this.y = y;
    }

    public setSpeedX(speedX: number): void {
        this.speedX = speedX;
    }

    public setSpeedY(speedY: number): void {
        this.speedY = speedY;
    }

    public setRadius(radius: number): void {
        this.radius = radius;
    }
}
