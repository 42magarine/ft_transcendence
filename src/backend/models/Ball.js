export class Ball {
    x;
    y;
    speedX;
    speedY;
    radius;
    constructor(x, y, speedX, speedY, radius) {
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.radius = radius;
    }
    // Sollten wir für die Ball Parameter constanten erstellen, damit man versteht was wir hier definieren?
    updateBall(timeStep = 1) {
        this.x += this.speedX * timeStep;
        this.y += this.speedY * timeStep;
    }
    revX() {
        this.speedX *= -1;
    }
    revY() {
        this.speedY *= -1;
    }
    randomizeDirection() {
        const randomXDirection = Math.random() > 0.5 ? 1 : -1;
        const randomYDirection = Math.random() > 0.5 ? 1 : -1;
        this.speedX *= randomXDirection;
        this.speedY *= randomYDirection;
    }
}
// funktionen sollten als private oder public definiert werden?
