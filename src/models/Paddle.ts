import { PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_MOVE_SPEED } from "../types/constants.js";

export class Paddle {
    x: number;
    y: number;
    height: number = PADDLE_HEIGHT;
    width: number = PADDLE_WIDTH;
    movespeed: number = PADDLE_MOVE_SPEED;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    moveUp(): void {
        this.y -= this.movespeed;
    }

    moveDown(): void {
        this.y += this.movespeed;
    }
}

// funktionen sollten als private oder public definiert werden?
