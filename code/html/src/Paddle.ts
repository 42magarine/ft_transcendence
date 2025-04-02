/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Paddle.ts                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: fwahl <fwahl@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/04/02 15:55:29 by fwahl             #+#    #+#             */
/*   Updated: 2025/04/02 15:55:30 by fwahl            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

export class Paddle {
	x: number;
	y: number;
	height: number;
	width: number;
	movespeed: number;

	constructor(x: number, y: number, height: number, width: number, speed: number){
		this.x = x;
		this.y = y;
		this.height = height;
		this.width = width;
		this.movespeed = speed;
	}

}
