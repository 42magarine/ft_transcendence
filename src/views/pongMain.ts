const socket: WebSocket = new WebSocket("ws://localhost:3000/ws");
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
let state: any = null;
let playerId: number | null = null;
let keysPressed: Record<string, boolean> = {};

//listen for websocket connection
socket.addEventListener("open", ()=> {
	console.log("connected to pong server");
});

socket.addEventListener("message", (event: MessageEvent<string>) => {
	const data = JSON.parse(event.data);

	if (data.type === "assignPlayer") {
		playerId = data.id;
		console.log("Assigned as Player", playerId);
	}

	if (data.type === "initGame" || data.type === "update") {
		state = data.state;
		draw();
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
	if (!state) return;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw ball
	ctx.beginPath();
	ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
	ctx.fillStyle = "#FFFFFF";
	ctx.fill();
	ctx.closePath();

	// Draw paddles
	ctx.fillStyle = "#FF0000";
	ctx.fillRect(10, state.paddle1.y, 10, 100); // Assuming paddle width=10, height=100
	ctx.fillRect(canvas.width - 20, state.paddle2.y, 10, 100);

	// Draw the scores
	ctx.font = "24px Arial";
	ctx.fillStyle = "#FFFFFF";
	ctx.fillText(`Player 1: ${state.score1}`, 50, 30);
	ctx.fillText(`Player 2: ${state.score2}`, canvas.width - 180, 30);
  }

  // Button click event to start the game
  const startGameBtn = document.getElementById("startGameBtn") as HTMLButtonElement;
  startGameBtn.addEventListener("click", () => {
	if (playerId) {
	  socket.send(JSON.stringify({ type: "initGame" })); // Send init message to the server
	}
  });
