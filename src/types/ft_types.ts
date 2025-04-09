import { GameState } from "./interfaces.js"

export type PaddleDirection = "up" | "down";

export type ClientMessage =
	| { type: "movePaddle"; direction: PaddleDirection }
	| { type: "initGame" }
	| { type: "pauseGame" }
	| { type: "resumeGame" }
	| { type: "resetGame" };

export type ServerMessage =
	| { type: "assignPlayer"; id: number; state: GameState }
	| { type: "update"; state: GameState }
	| { type: "initGame"; state: GameState }
	| { type: "pauseGame"; state: GameState }
	| { type: "resumeGame"; state: GameState }
	| { type: "resetGame"; state: GameState }
	| { type: "playerDisconnected"; id: number }
	| { type: "error"; message: string };
