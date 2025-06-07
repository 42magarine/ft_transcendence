import type MessageHandlerService from '../frontend/services/MessageHandlerService.js';
import type LobbyListService from '../frontend/services/LobbyListService.js';
import type LobbyService from '../frontend/services/LobbyService.js';
import type TournamentListService from '../frontend/services/TournamentListService.js';
import type TournamentService from '../frontend/services/TournamentService.js';
import type UserService from '../frontend/services/UserService.js';
import PongService from '../frontend/services/PongService.js';
import type UserManagementService from '../frontend/services/UserManagementService.js';
import AbstractView from "../utils/AbstractView.js";

export interface RouteHookContext {
    route: Route;
    params: Record<string, string>;
    view: AbstractView;
    path: string;
    from: string;
    to: string;
}

export interface Route {
    path: string | RegExp;
    view: new (params: URLSearchParams) => AbstractView;
    metadata?: {
        title?: string;
        description?: string;
    };
    role?: string;
    onEnter?: (context: RouteHookContext) => Promise<boolean | void>;
    onLeave?: (context: RouteHookContext) => Promise<boolean | void>;
}

declare global {
    interface Window {
        currentUser: User | null;
        ft_socket?: WebSocket;
        socketReady: Promise<void>;
        messageHandler: MessageHandlerService;
        lobbyListService: LobbyListService;
        lobbyService: LobbyService;
        tournamentService: TournamentService;
        tournamentListService: TournamentListService;
        userService: UserService;
        userManagementService: UserManagementService;
        pongService: PongService;
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
    player1Left: boolean;
    player2Left: boolean;
    winnerName?: string;
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

// MESSAGE INTERFACES

export interface IClientMessage {
    type: string;
    userId?: number;
    targetUserId?: number;
    inviteId?: string;
    lobbyId?: string;
    direction?: IPaddleDirection;
    message?: string;
    gameIsOver?: boolean;
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
    gameState?: IGameState;
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
