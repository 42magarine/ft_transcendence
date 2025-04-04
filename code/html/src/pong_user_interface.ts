const socket: WebSocket = new WebSocket("ws://localhost:3000/ws");
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
let state: any = null;

//listen for websocket connection
socket.addEventListener("open", ()=> {
	console.log("connected to pong server");
});

socket.addEventListener("message", (event: MessageEvent<string>) => {
	const data = JSON.parse(event.data);

	if (data.type == "initGame" || data.type == "update") {
		state = data.state;
		draw();
	}
});

function draw() {
	if (!state)
		return ;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	//ball
	ctx.beginPath();
	ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
	ctx.fillStyle = "#fff"; //paceholder color
	ctx.fill();
	ctx.closePath();

	//paddles
	ctx.fillStyle = "#fff" //placehodler color
	ctx.fillRect(10, state.paddle1.y, 10, 100);
	ctx.fillRect(canvas.width - 20, state.paddle2.y, 10, 100);

	//draw scores
	ctx.font = "24px Arial"; //css ?
	ctx.fillText(`Player 1: ${state.score1}`, 50, 30);
	ctx.fillText(`Player 2: ${state.score2}`, canvas.width - 180, 30);
}

window.addEventListener("keydown", (e: KeyboardEvent) => {
	if (e.key === "w") {
		socket.send(JSON.stringify({ type: "movePaddle", player: 1, direction: "up" }));
	}
	else if (e.key === "s") {
		socket.send(JSON.stringify({ type: "movePaddle", player: 1, direction: "down" }));
	}
	else if (e.key === "ArrowUp") {
		socket.send(JSON.stringify({ type: "movePaddle", player: 2, direction: "up" }));
	}
	else if (e.key === "ArrowDown") {
		socket.send(JSON.stringify({ type: "movePaddle", player: 2, direction: "down" }));
	}
});

