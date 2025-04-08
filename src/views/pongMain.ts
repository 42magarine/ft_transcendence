// const socket: WebSocket = new WebSocket("ws://localhost:3000/ws");
const socket: WebSocket = new WebSocket("ws://10.11.2.29:3000/ws");
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
let state: any = null;
let playerId: number | null = null;
let keysPressed: Record<string, boolean> = {};
let sessionId: string | null = localStorage.getItem("sessionId");
import { PADDLE_WIDTH, PADDLE_HEIGHT, BALL_RADIUS } from "../models/Constants.js";
//listen for websocket connection
socket.addEventListener("open", () => {
	console.log("Connected to pong server");

	if (!sessionId) {
	  // If no sessionId is found in localStorage, generate a new sessionId and store it
	  sessionId = generateSessionId();
	  localStorage.setItem("sessionId", sessionId);
	  console.log("Generated new sessionId:", sessionId);
	}

	// Check if playerId is stored in localStorage
	const storedPlayerId = localStorage.getItem("playerId");
	if (storedPlayerId) {
	  // If there is a stored playerId, try to reconnect with that playerId and sessionId
	  playerId = parseInt(storedPlayerId);
	  socket.send(JSON.stringify({ type: "reconnectPlayer", playerId, sessionId }));
	  console.log(`Reconnecting as Player ${playerId}`);
	}
  });


socket.addEventListener("message", (event: MessageEvent<string>) => {
	const data = JSON.parse(event.data);

	if (data.type === "assignPlayer") {
		playerId = data.id;
		console.log("Assigned as Player", playerId);
		if (playerId !== null)
			localStorage.setItem("playerId", playerId.toString());
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
		console.log("Game resumed.");
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
			socket.send(JSON.stringify({ type: "movePaddle", direction: "up" }));
		}
		if (keysPressed["s"]) {
			socket.send(JSON.stringify({ type: "movePaddle", direction: "down" }));
		}
	} else if (playerId === 2) {
		if (keysPressed["ArrowUp"]) {
			socket.send(JSON.stringify({ type: "movePaddle", direction: "up" }));
		}
		if (keysPressed["ArrowDown"]) {
			socket.send(JSON.stringify({ type: "movePaddle", direction: "down" }));
		}
	}
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
	// if (playerId) {
		socket.send(JSON.stringify({ type: "initGame" })); // Send init message to the server
	// }
  });

  const pauseGameBtn = document.getElementById("pauseGameBtn") as HTMLButtonElement;
  pauseGameBtn.addEventListener("click", () => {
	  socket.send(JSON.stringify({ type: "pauseGame" }));
  });

  const resumeGameBtn = document.getElementById("resumeGameBtn") as HTMLButtonElement;
  resumeGameBtn.addEventListener("click", () => {
	  socket.send(JSON.stringify({ type: "resumeGame" }));
  });

  const resetGameBtn = document.getElementById("resetGameBtn") as HTMLButtonElement;
  resetGameBtn.addEventListener("click", () => {
	  socket.send(JSON.stringify({ type: "resetGame" }));
  });


  function generateSessionId() {
	return Math.random().toString(36).substring(2, 15);  // Generates a random string
  }
