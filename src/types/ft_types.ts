import { IGameState } from "./interfaces.js"

export type PaddleDirection = "up" | "down";

export type ClientMessage =
    | { type: "movePaddle"; direction: PaddleDirection }
    | { type: "initGame" }
    | { type: "pauseGame" }
    | { type: "resumeGame" }
    | { type: "resetGame" };

export type ServerMessage =
    | { type: "assignPlayer"; id: number; state: IGameState }
    | { type: "update"; state: IGameState }
    | { type: "initGame"; state: IGameState }
    | { type: "pauseGame"; state: IGameState }
    | { type: "resumeGame"; state: IGameState }
    | { type: "resetGame"; state: IGameState }
    | { type: "playerDisconnected"; id: number }
    | { type: "error"; message: string };
