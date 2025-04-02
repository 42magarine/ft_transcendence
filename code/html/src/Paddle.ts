/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Paddle.ts                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: fwahl <fwahl@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/04/02 15:55:29 by fwahl             #+#    #+#             */
/*   Updated: 2025/04/02 16:36:47 by fwahl            ###   ########.fr       */
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

}
