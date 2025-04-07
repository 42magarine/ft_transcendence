/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Pong.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: fwahl <fwahl@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/04/02 14:16:08 by fwahl             #+#    #+#             */
/*   Updated: 2025/04/07 19:32:20 by fwahl            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Ball } from "./Ball.js";
import { Paddle } from "./Paddle.js";
import { Player } from "./PongPlayer.js";

export class PongGame {
	private ball: Ball;
	private paddle1: Paddle;
	private paddle2: Paddle;
	private score1: number = 0;
	private score2: number = 0;
	private isRunning: boolean = false;

	constructor(private width: number, private heigth: number){
		this.ball = new Ball(this.width / 2, this.heigth / 2, 4, 4, 10);
        this.paddle1 = new Paddle(10, this.heigth / 2 - 50);
        this.paddle2 = new Paddle(this.width - 20, this.heigth / 2 - 50);
	}

	resetGame(): void {
		this.ball = new Ball(this.width / 2, this.heigth / 2, 4, 4, 10);
        this.paddle1 = new Paddle(10, this.heigth / 2 - 50);
        this.paddle2 = new Paddle(this.width - 20, this.heigth / 2 - 50);
	}

	update(): void {
		this.ball.updateBall();

		if (this.ball.y <= 0 || this.ball.y >= this.heigth) {
			this.ball.revY();
		}

		if (this.isColliding(this.ball, this.paddle1) || this.isColliding(this.ball, this.paddle2)) {
			this.ball.revX();
		}

		if (this.ball.x < 0) {
			this.score2++;
			this.resetGame();
		} else if (this.ball.x > this.width) {
			this.score1++;
			this.resetGame();
		}
	}

	isColliding(ball: Ball, paddle: Paddle): boolean {
		return (
			ball.x - ball.radius <= paddle.x + paddle.width &&
			ball.x + ball.radius >= paddle.x &&
			ball.y + ball.radius >= paddle.y &&
			ball.y - ball.radius <= paddle.y + paddle.height
		);
	}

	movePaddle(player: Player, direction: "up" | "down"): void {
		const paddle = player.id === 1 ? this.paddle1 : this.paddle2;
		if (direction === "up" && paddle.y > 0) {
			paddle.moveUp();
		} else if (direction === "down" && paddle.y + paddle.height < this.heigth) {
			paddle.moveDown();
		}
	}

	getState(): object {
		return {
			ball: { x: this.ball.x, y: this.ball.y },
			paddle1: { y: this.paddle1.y },
			paddle2: { y: this.paddle2.y },
			score1: this.score1,
			score2: this.score2
		};
	}
}
