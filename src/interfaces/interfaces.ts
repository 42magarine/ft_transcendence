import type MessageHandlerService from '../frontend/services/MessageHandlerService.js';
import type LobbyListService from '../frontend/services/LobbyListService.js';
import type LobbyService from '../frontend/services/LobbyService.js';
import type UserService from '../frontend/services/UserService.js';
import type UserManagementService from '../frontend/services/UserManagementService.js';
import AbstractView from "../utils/AbstractView.js";

export interface Route {
    path: string | RegExp;
    view: new (params: URLSearchParams) => AbstractView;
    metadata?: {
        title?: string;
        description?: string;
    };
    role?: string;
}

declare global {
    interface Window {
        ft_socket?: WebSocket;
        socketReady: Promise<void>;
        messageHandler: MessageHandlerService;
        lobbyListService: LobbyListService;
        lobbyService: LobbyService;
        userService: UserService;
        userManagementService: UserManagementService;
    }
}

export { };

export type IPaddleDirection = 'up' | 'down';

export interface IPaddleState {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface IBallState {
    x: number;
    y: number;
    radius: number;
    speedX: number;
    speedY: number;
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

export interface ILobbyState {
    lobbyId: string;
    name: string;
    creatorId: number | undefined;
    maxPlayers: number;
    currentPlayers: number;
    createdAt: Date;
    lobbyPlayers?: IPlayerState[];
    lobbyType: "game" | "tournament"
    isStarted: boolean;
}

export interface IPlayerState {
    playerNumber: number;
    userId: number;
    userName: string;
    isReady: boolean;
}

// =========================
// MESSAGE INTERFACES
// =========================

export interface IClientMessage {
    type: string;
    userId?: number;
    targetUserId?: number;
    inviteId?: string;
    lobbyId?: string;
    direction?: IPaddleDirection;
    message?: string;
    [key: string]: any;
}


export interface IServerMessage {
    type: string;
    message?: string;
    playerNumber?: number;
    playerCount?: number;
    lobbyId?: string;
    userId?: number;
    direction?: IPaddleDirection;
    timestamp?: string;
    lobbies?: ILobbyState[]
    [key: string]: any;
}

export interface User {
    id?: number;
    username: string;
    email: string;
    name?: string;
    role?: string;
    hasClickedStart?: boolean;
    isJoined?: boolean;
    isCreator?: boolean;
}
