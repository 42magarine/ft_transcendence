/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Ball.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: fwahl <fwahl@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/04/02 15:55:26 by fwahl             #+#    #+#             */
/*   Updated: 2025/04/02 15:55:27 by fwahl            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

export class Ball {
	x: number;
	y: number;
	speedX: number;
	speedY: number;
	radius: number;

	constructor(x: number, y: number, speedX: number, speedY: number, radius: number)
	{
		this.x = x;
		this.y = y;
		this.speedX = speedX;
		this.speedY = speedY;
		this.radius = radius;
	}

	updateBall(): void
	{
		this.x += this.speedX;
		this.y += this.speedY;
	}

	revX(): void
	{
		this.speedX *= -1;
	}
	revY(): void
	{
		this.speedY *= -1;
	}
}
