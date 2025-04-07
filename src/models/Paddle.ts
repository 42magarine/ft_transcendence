/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Paddle.ts                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: fwahl <fwahl@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/04/02 15:55:29 by fwahl             #+#    #+#             */
/*   Updated: 2025/04/07 17:47:16 by fwahl            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

export class Paddle {
	x: number;
	y: number;
	height: number = 10;
	width: number = 100;
	movespeed: number = 10;


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
