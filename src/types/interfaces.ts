import { Player } from "../backend/models/Player.js";

export type IPaddleDirection = 'up' | 'down';

export interface IBallState {
    x: number;
    y: number;
    radius: number;
}

export interface IPaddleState {
    x: number;
    y: number;
    width: number;
    height: number;
}


export interface IGameState {
    ball: IBallState
    paddle1: IPaddleState
    paddle2: IPaddleState
    score1: number;
    score2: number;
    paused: boolean;
    running: boolean;
    gameIsOver: boolean;
}

export interface LobbyInfo {
    id: string;
    players: number;
    maxPlayers: number;
    creator: string | number;
}

export interface PlayerInfo {
    id: number;
    username: string;
    score: number;
}

export interface GameResult {
    id: number;
    player1: PlayerInfo;
    player2: PlayerInfo;
    winner: string;
    date: Date;
}

export interface GameHistoryResponse {
    id: number;
    player2: string;
    playerScore: number;
    opponentScore: number;
    result: string;
    date: Date;
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            id: number;
            role: string;
        }
    }
}
