/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Ball.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: fwahl <fwahl@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/04/02 15:55:26 by fwahl             #+#    #+#             */
/*   Updated: 2025/04/08 19:11:12 by fwahl            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

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
