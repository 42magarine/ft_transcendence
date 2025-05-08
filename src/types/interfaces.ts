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

// export interface BaseMessage {
//     type: string
// }

export interface ClientMessage {
    type: string;
    userId?: number;
    targetUserId?: number;
    inviteId?: string;
    lobbyId?: string;
    direction?: IPaddleDirection;
    message?: string;
    [key: string]: any;
}

export interface GameActionMessage extends ClientMessage {
    type: "gameAction";
    action?: string;
}

export interface ReadyMessage extends ClientMessage {
    ready: boolean;
}

export interface joinLobbyMessage extends ClientMessage {
    type: "joinLobby"
}

export interface createLobbyMessage extends ClientMessage {
    type: "createLobby"
}

export interface leaveLobby extends ClientMessage {
    type: "leaveLobby"
}

export interface ServerMessage {
    type: string;
    message?: string;
    playerId?: number;
    playerCount?: number;
    lobbyId?: string;
    userId?: number;
    direction?: IPaddleDirection;
    timestamp?: string;
    [key: string]: any;
}

export interface GameStateMessage extends ServerMessage {
    type: "gameState";
    gameState: IGameState;
}
