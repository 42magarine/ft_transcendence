import { PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_MOVE_SPEED } from "../../types/constants.js";
export class Paddle {
    x;
    y;
    height = PADDLE_HEIGHT;
    width = PADDLE_WIDTH;
    movespeed = PADDLE_MOVE_SPEED;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    moveUp() {
        this.y -= this.movespeed;
    }
    moveDown() {
        this.y += this.movespeed;
    }
}
// funktionen sollten als private oder public definiert werden?
