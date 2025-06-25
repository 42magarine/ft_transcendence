import type MessageHandlerService from '../frontend/services/MessageHandlerService.js';
import type LobbyService from '../frontend/services/LobbyService.js';
import type LobbyListService from '../frontend/services/LobbyListService.js';
import type TournamentService from '../frontend/services/TournamentService.js';
import type UserService from '../frontend/services/UserService.js';
import type UserManagementService from '../frontend/services/UserManagementService.js';
import type PongService from '../frontend/services/PongService.js';
import type LanguageService from '../frontend/services/LanguageService.js';
import AbstractView from "../utils/AbstractView.js";
import TwoFactorInputHandler from '../utils/TwoFactorInputHandler.js';
import LocalGameService from '../frontend/services/LocalGameService.js';

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
    view: new (routeParams: Record<string, string>, queryParams: URLSearchParams) => AbstractView;
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
        ls: LanguageService;
        messageHandler: MessageHandlerService;
        lobbyListService: LobbyListService;
        handler?: TwoFactorInputHandler;
        localGameService: LocalGameService;
        lobbyService: LobbyService;
        tournamentService: TournamentService;
        userService: UserService;
        userManagementService: UserManagementService;
        pongService: PongService;
        __: (key: string) => string;
        handleModalOutsideClick: (event: Event, id: string) => void;
    }
}

export { };

export interface MatchRecord {
    id: number;
    status: string;
    createdAt: string;
    player1: {
        id: number;
        username: string;
    };
    player2: {
        id: number;
        username: string;
    };
    winner: {
        id: number;
        username: string;
    } | null;
}


export type IPaddleDirection = 'up' | 'down';

export interface IPaddleState {
    x: number;
    y: number;
    width: number;
    height: number;
    speed?: number;
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
    matchId?: number
    player1Id?: number
    player2Id?: number
    player1Left: boolean;
    player2Left: boolean;
    winnerName?: string;
}

export interface ILobbyState {
    lobbyId: string;
    name: string;
    creatorId: number;
    maxPlayers: number;
    currentPlayers: number;
    createdAt: Date;
    lobbyType: 'game' | 'tournament';
    lobbyPlayers: IPlayerState[];
    isStarted: boolean;
    tournamentStatus?: 'pending' | 'ongoing' | 'completed' | 'cancelled';
    currentRound?: number;
    playerPoints?: { [userId: number]: number }; // userId -> points
    matchSchedule?: ITournamentRound[]; // Full tournament schedule
    activeGames: IActiveGameInfo[];
}

export interface IPlayerState {
    playerNumber: number;
    userId: number;
    userName: string;
    isReady: boolean;
    points?: number;
}

export interface IActiveGameInfo {
    matchId: number;
    player1Id?: number;
    player2Id?: number;
    score1: number;
    score2: number;
}

export interface ITournamentMatchPairing {
    player1Id: number;
    player2Id: number;
    matchId: number | null;
    isCompleted: boolean
}

export interface ITournamentRound {
    roundNumber: number;
    matches: ITournamentMatchPairing[];
}

// MESSAGE INTERFACES

export interface IClientMessage {
    type: "createLobby" | "joinLobby" | "joinGame" | "leaveLobby" | "movePaddle" | "ready" | "startGame" | "getLobbyList" | "getLobbyState" | "updateFriendlist" | "playerLeftGame" | "gameJoined";
    lobbyId?: string;
    userId?: number;
    lobbyType?: 'game' | 'tournament';
    maxPlayers?: number;
    players?: IPlayerState[];
    playerNumber?: number;
    direction?: IPaddleDirection;
    ready?: boolean;
    matchId?: number;
    message?: string;
    gameIsOver?: boolean;
    [key: string]: any;
}

export interface IServerMessage {
    type: "connection" | "error" | "lobbyCreated" | "joinedLobby" | "playerJoined" | "playerLeft" | "lobbyList" | "lobbyState" | "playerReady" | "gameStarted" | "gameStateUpdate" | "gameOver" | "leftLobby" | "tournamentStarted" | "tournamentRoundStart" | "tournamentMatchStart" | "tournamentMatchOver" | "tournamentFinished" | "tournamentCancelled" | "updateFriendlist" | "playerLeftGame" | "initMatchStart";
    message?: string;
    lobbyId?: string;
    owner?: number;
    lobbyType?: 'game' | 'tournament';
    maxPlayers?: number;
    lobby?: ILobbyState;
    lobbies?: ILobbyState[];
    gameState?: IGameState;
    activeGamesStates?: IGameState[];
    winningUserId?: number | null;
    winnerId?: number | null;
    player1Score?: number;
    player2Score?: number;
    matchId?: number;
    player1Name?: string;
    player2Name?: string;
    winnerUserName?: string | null;
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
