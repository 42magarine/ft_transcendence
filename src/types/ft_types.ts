import { BaseMessage, ClientMessage, GameActionMessage, GameStateMessage, ServerMessage } from "./interfaces.js"

// export type ClientMessage =
//     | { type: "movePaddle"; direction: IPaddleDirection }
//     | { type: "initGame" }
//     | { type: "pauseGame" }
//     | { type: "resumeGame" }
//     | { type: "resetGame" };

export type AllServerMessage =
    | BaseMessage
    | ClientMessage
    | ServerMessage
    | GameStateMessage
    | GameActionMessage