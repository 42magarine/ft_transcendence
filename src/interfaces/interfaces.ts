import type MessageHandlerService from '../frontend/services/MessageHandlerService.js';
import type LobbyListService from '../frontend/services/LobbyListService.js';
import type LobbyService from '../frontend/services/LobbyService.js';
import type UserService from '../frontend/services/UserService.js';
import type UserMangementService from '../frontend/services/UserManagementService.js';
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
		socketReady?: Promise<void>;
		messageHandler?: MessageHandlerService;
		lobbyListService: LobbyListService;
		lobbyService?: LobbyService;
		userService: UserService;
		userManagementService: UserMangementService;
	}
}

export {};

export interface BallStateWithVelocity {
	x: number;
	y: number;
	radius: number;
	velocityX: number;
	velocityY: number;
}

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
    lobbyId: string;
    name: string;
    creatorId: number | undefined;
    maxPlayers: number;
    currentPlayers: number;
    createdAt: Date;
    lobbyType: "game" | "tournament"
    isStarted: boolean;
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
    type: "joinLobby";
}

export interface createLobbyMessage extends ClientMessage {
    type: "createLobby";
}

export interface leaveLobbyMessage extends ClientMessage {
    type: "leaveLobby";
}

export interface ServerMessage {
    type: string;
    message?: string;
    playerNumber?: number;
    playerCount?: number;
    lobbyId?: string;
    userId?: number;
    direction?: IPaddleDirection;
    timestamp?: string;
    lobbies?: LobbyInfo[]
    [key: string]: any;
}

export interface GameStateMessage extends ServerMessage {
    type: "gameState";
    gameState: IGameState;
}

export interface User {
    id?: number;
    username: string;
    email: string;
    displayname?: string;
    role?: string;
    hasClickedStart?: boolean;
    isJoined?: boolean;
    isCreator?: boolean;
}

export interface PlayerDisplayState extends Partial<LobbyParticipant> {
    isCreator?: boolean;
    isJoined?: boolean;
}

export interface LobbyParticipant extends User {
    isReady: boolean; // Essential for the UI
    // isCreator can be derived by comparing id with lobbyData.creatorId
}

// This is what LobbyService should ideally provide for currentLobbyData
// when Lobby.ts needs to render the view.
export interface LobbyDataWithParticipants extends LobbyInfo {
    // LobbyInfo is your existing interface
    participants: LobbyParticipant[]; // THE CRUCIAL ADDITION
}
