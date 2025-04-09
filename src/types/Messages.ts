export interface ClientMessage {
	type: "movePaddle" | "initGame" | "resetGame" | "pauseGame" | "resumeGame";
	direction?: "up" | "down";
}

export interface ServerMessage {
	type: string;
	[key: string]: any;
}
