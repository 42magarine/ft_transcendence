import { ClientMessage, ServerMessage } from "../types/ft_types.js";
import { GameState } from "../types/interfaces.js"
const socket: WebSocket = new WebSocket("ws://10.11.2.27:3000/ws");
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
let state: GameState | null = null;
let playerId: number | null = null;
let keysPressed: Record<string, boolean> = {};

import { PADDLE_WIDTH, PADDLE_HEIGHT, BALL_RADIUS } from "../models/Constants.js";

// Listen for WebSocket connection
socket.addEventListener("open", () => {
	console.log("connected to pong server");
});

socket.addEventListener("message", (event: MessageEvent<string>) => {
	const data: ServerMessage = JSON.parse(event.data);

	// Handle different server message types
	if (data.type === "assignPlayer") {
		playerId = data.id;
		state = data.state;
		console.log("Assigned as Player", playerId);
	}

	if (data.type === "initGame" || data.type === "update") {
		state = data.state;
		draw();
		console.log("Game started.");
	}

	if (data.type === "pauseGame") {
		state = data.state;
		draw();
		console.log("Game paused.");
	}

	if (data.type === "resumeGame") {
		state = data.state;
		draw();
		console.log("Game restarted.");
	}

	if (data.type === "resetGame") {
		state = data.state;
		draw();
		console.log("Game reset.");
	}

	if (data.type === "playerDisconnected") {
		console.log("Player disconnected:", data.id);
	}
});

socket.addEventListener("error", (err) => {
	console.error("WebSocket error:", err);
});

window.addEventListener("keydown", (e) => {
	keysPressed[e.key] = true;
});

window.addEventListener("keyup", (e) => {
	keysPressed[e.key] = false;
});

function handleInput() {
	if (playerId === 1) {
		if (keysPressed["w"]) {
			sendMovePaddle("up");
		}
		if (keysPressed["s"]) {
			sendMovePaddle("down");
		}
	} else if (playerId === 2) {
		if (keysPressed["ArrowUp"]) {
			sendMovePaddle("up");
		}
		if (keysPressed["ArrowDown"]) {
			sendMovePaddle("down");
		}
	}
}

function sendMovePaddle(direction: "up" | "down") {
	const moveMsg: ClientMessage = {
		type: "movePaddle",
		direction: direction,
	};
	socket.send(JSON.stringify(moveMsg));
}

setInterval(handleInput, 1000 / 60);

function draw() {
	if (!state || state.paused) return;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw ball
	ctx.beginPath();
	ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
	ctx.fillStyle = "#FFFFFF";
	ctx.fill();
	ctx.closePath();

	// Draw paddles (filled)
	ctx.fillStyle = "#FF0000";
	ctx.fillRect(state.paddle1.x, state.paddle1.y, state.paddle1.width, state.paddle1.height);
	ctx.fillRect(state.paddle2.x, state.paddle2.y, state.paddle2.width, state.paddle2.height);

	// Add paddle hitbox outlines
	ctx.strokeStyle = "#00FF00"; // Green outline for debugging
	ctx.strokeRect(state.paddle1.x, state.paddle1.y, state.paddle1.width, state.paddle1.height);
	ctx.strokeRect(state.paddle2.x, state.paddle2.y, state.paddle2.width, state.paddle2.height);

	// Draw scores
	ctx.font = "24px Arial";
	ctx.fillStyle = "#FFFFFF";
	ctx.fillText(`Player 1: ${state.score1}`, 50, 30);
	ctx.fillText(`Player 2: ${state.score2}`, canvas.width - 180, 30);
}

const startGameBtn = document.getElementById("startGameBtn") as HTMLButtonElement;
startGameBtn.addEventListener("click", () => {
	// If playerId is not null, send initGame message
	if (playerId !== null) {
		const initMsg: ClientMessage = { type: "initGame" };
		socket.send(JSON.stringify(initMsg));
	}
});

const pauseGameBtn = document.getElementById("pauseGameBtn") as HTMLButtonElement;
pauseGameBtn.addEventListener("click", () => {
	const pauseMsg: ClientMessage = { type: "pauseGame" };
	socket.send(JSON.stringify(pauseMsg));
});

const resumeGameBtn = document.getElementById("resumeGameBtn") as HTMLButtonElement;
resumeGameBtn.addEventListener("click", () => {
	const resumeMsg: ClientMessage = { type: "resumeGame" };
	socket.send(JSON.stringify(resumeMsg));
});

const resetGameBtn = document.getElementById("resetGameBtn") as HTMLButtonElement;
resetGameBtn.addEventListener("click", () => {
	const resetMsg: ClientMessage = { type: "resetGame" };
	socket.send(JSON.stringify(resetMsg));
});
