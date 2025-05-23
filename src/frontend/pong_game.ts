import { ClientMessage, ServerMessage } from "../interfaces/interfaces.js";
import { IPaddleDirection } from "../interfaces/interfaces.js";
import { IGameState } from "../interfaces/interfaces.js"

// === CLEANUP LOGIC ON TAB CLOSE / NAVIGATION ===
window.addEventListener("beforeunload", () => {
    const msg: ClientMessage = { type: "resetGame" };
    safeSend(msg);
});

window.addEventListener("unload", () => {
    const msg: ClientMessage = { type: "resetGame" };
    safeSend(msg);
});

const socket: WebSocket = new WebSocket(`wss://${window.location.host}/game/wss`);

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
let state: IGameState | null = null;
let playerId: number | null = null;
let keysPressed: Record<string, boolean> = {};

// The "open" event is triggered when the connection to the WebSocket server is successfully established.
socket.addEventListener("open", () => {
    console.log("Connected to WebSocket server");

    // createLobby();
});

// function createLobby() {
// 	// Get user ID from localStorage or session if available

// 	const createMsg: ClientMessage = {
// 		type: "createLobby"
// 	};
// 	safeSend(createMsg);
// 	console.log("Creating lobby...");
// }

// The "message" event is triggered when the server sends a message over WebSocket.
socket.addEventListener("message", (event: MessageEvent<string>) => {
    const data: ServerMessage = JSON.parse(event.data);

    if (data.type === "assignPlayer") {
        playerId = data.id;
        state = data.state!;
    }

    if (data.type === "startGame" ||
        data.type === "update" ||
        data.type === "pauseGame" ||
        data.type === "resumeGame" ||
        data.type === "resetGame") {
        state = data.state!;
        draw();
    }
});

window.addEventListener("keydown", (event: KeyboardEvent) => {
    keysPressed[event.key] = true;
});

window.addEventListener("keyup", (event: KeyboardEvent) => {
    keysPressed[event.key] = false;
});

function handleInput() {
    if (playerId === 1) {
        if (keysPressed["w"]) {
            sendMovePaddle("up");
        }
        if (keysPressed["s"]) {
            sendMovePaddle("down");
        }
    }
    else if (playerId === 2) {
        if (keysPressed["ArrowUp"]) {
            sendMovePaddle("up");
        }
        if (keysPressed["ArrowDown"]) {
            sendMovePaddle("down");
        }
    }
}

function sendMovePaddle(direction: IPaddleDirection) {
    const moveMsg: ClientMessage = {
        type: "movePaddle",
        direction: direction
    };
    safeSend(moveMsg);
}

function safeSend(msg: ClientMessage) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg));
    }
    else {
        console.warn("Tried to send a message but WebSocket is not open:", msg);
    }
}

setInterval(handleInput, 1000 / 60);

function draw() {
    if (!state || state.paused) {
        return;
    }

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

const startGameButton = document.getElementById("startGameButton") as HTMLButtonElement;
startGameButton.addEventListener("submit", () => {
    // If playerId is not null, send initGame message
    // if (playerId !== null) {
    const startMsg: ClientMessage = { type: "startGame" };
    safeSend(startMsg);
    // }
});

const pauseGameButton = document.getElementById("pauseGameButton") as HTMLButtonElement;
pauseGameButton.addEventListener("click", () => {
    const pauseMsg: ClientMessage = { type: "pauseGame" };
    safeSend(pauseMsg);
});

const resumeGameButton = document.getElementById("resumeGameButton") as HTMLButtonElement;
resumeGameButton.addEventListener("click", () => {
    const resumeMsg: ClientMessage = { type: "resumeGame" };
    safeSend(resumeMsg);
});

const resetGameButton = document.getElementById("resetGameButton") as HTMLButtonElement;
resetGameButton.addEventListener("click", () => {
    const resetMsg: ClientMessage = { type: "resetGame" };
    safeSend(resetMsg);
});
