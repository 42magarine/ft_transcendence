export declare class Ball {
    x: number;
    y: number;
    speedX: number;
    speedY: number;
    radius: number;
    constructor(x: number, y: number, speedX: number, speedY: number, radius: number);
    updateBall(timeStep?: number): void;
    revX(): void;
    revY(): void;
    randomizeDirection(): void;
}
