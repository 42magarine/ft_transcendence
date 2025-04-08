/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Paddle.ts                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: fwahl <fwahl@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/04/02 15:55:29 by fwahl             #+#    #+#             */
/*   Updated: 2025/04/08 15:05:46 by fwahl            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_MOVE_SPEED } from "./Constants.js";

export class Paddle {
	x: number;
	y: number;
	height: number = PADDLE_HEIGHT;
	width: number = PADDLE_WIDTH;
	movespeed: number = PADDLE_MOVE_SPEED;


	constructor(x: number, y: number){
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
