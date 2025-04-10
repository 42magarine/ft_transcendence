export class Ball {
    x: number;
    y: number;
    speedX: number;
    speedY: number;
    radius: number;

    constructor(x: number, y: number, speedX: number, speedY: number, radius: number) {
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.radius = radius;
    }
    // Sollten wir für die Ball Parameter constanten erstellen, damit man versteht was wir hier definieren?

    updateBall(timeStep = 1): void {
        this.x += this.speedX * timeStep;
        this.y += this.speedY * timeStep;
    }

    revX(): void {
        this.speedX *= -1;
    }

    revY(): void {
        this.speedY *= -1;
    }

    randomizeDirection(): void {
        const randomXDirection = Math.random() > 0.5 ? 1 : -1;
        const randomYDirection = Math.random() > 0.5 ? 1 : -1;
        this.speedX *= randomXDirection;
        this.speedY *= randomYDirection;
    }
}

// funktionen sollten als private oder public definiert werden?
