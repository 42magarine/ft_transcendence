import { IGameState, IPaddleDirection, IPaddleState } from "./interfaces.js"

// export type ClientMessage =
//     | { type: "movePaddle"; direction: IPaddleDirection }
//     | { type: "initGame" }
//     | { type: "pauseGame" }
//     | { type: "resumeGame" }
//     | { type: "resetGame" };

// export type ServerMessage =
//     | { type: "assignPlayer"; id: number; state: IGameState }
//     | { type: "update"; state: IGameState }
//     | { type: "initGame"; state: IGameState }
//     | { type: "pauseGame"; state: IGameState }
//     | { type: "resumeGame"; state: IGameState }
//     | { type: "resetGame"; state: IGameState }
//     | { type: "playerConnected"; id: number }
//     | { type: "playerDisconnected"; id: number }
//     | { type: "error"; message: string };


export interface ClientMessage {
    type: string;
    userId?: number;
    lobbyId?: string;
    direction?: IPaddleDirection;
    action?: string;
    message?: string;
    [key: string]: any;
}


export interface ServerMessage {
    type: string;
    message?: string;
    state?: IGameState;
    playerId?: number;
    playerCount?: number;
    lobbyId?: string;
    userId?: number;
    direction?: IPaddleDirection;
    timestamp?: string;
    [key: string]: any;
}
