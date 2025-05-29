import { ServerMessage, LobbyInfo } from '../../interfaces/interfaces.js';
import MessageHandlerService from './MessageHandlerService.js';
import UserService from './UserService.js';
// import Router from '../../utils/Router.js'; // Only if needed for navigation from here

export default class LobbyService {
    private currentLobbyData?: LobbyInfo;
    private socket?: WebSocket;

    private messageHandler!: MessageHandlerService;
    private userService!: UserService;
    private isInitialized: boolean = false;

    constructor() {
        this.handleSocketMessage = this.handleSocketMessage.bind(this);
        this.handleLobbyPageClick = this.handleLobbyPageClick.bind(this);
    }

    private getCurrentLobbyIdFromUrl(): string {
        const match = window.location.pathname.match(/\/lobby\/([^/]+)/);
        return match?.[1] || '';
    }

    public init(socket: WebSocket, messageHandler: MessageHandlerService, userService: UserService): void {
        if (this.isInitialized && this.socket === socket) {
            this.setupUIEventListeners();
            return;
        }

        this.socket = socket;
        this.messageHandler = messageHandler;
        this.userService = userService;

        this.socket.removeEventListener('message', this.handleSocketMessage);
        this.socket.addEventListener('message', this.handleSocketMessage);
        this.setupUIEventListeners();
        this.isInitialized = true;
    }

    private handleSocketMessage(event: MessageEvent<string>): void {
        const data: ServerMessage = JSON.parse(event.data);
        const currentLobbyId = this.getCurrentLobbyIdFromUrl();

        switch (data.type) {
            case 'lobbyInfo':
                if (data.lobby) {
                    if (currentLobbyId && data.lobby.id === currentLobbyId) {
                        this.currentLobbyData = {
                            ...data.lobby,
                            createdAt: new Date(data.lobby.createdAt)
                        };
                        // update UI here with new lobbyInfo
                        console.log(`[LobbyService] Updated lobbyInfo for ${currentLobbyId}`, this.currentLobbyData);
                    } else if (currentLobbyId) {
                        console.warn(`[LobbyService] Received lobbyInfo for ${data.lobby.id}, but current lobby is ${currentLobbyId}. Ignoring.`);
                    }
                } else {
                    console.error('[LobbyService] Received lobbyInfo message without lobby data.');
                }
                break;

            case 'playerReady':
                    if (currentLobbyId && data.lobbyId === currentLobbyId) {
                    console.log(`[LobbyService] Player ${data.userId} is ready in lobby ${data.lobbyId}`);
                    // update player status UI
                }
                break;

            case 'allPlayersReady':
                    console.log("alle sind reeeeady")
                break ;

            case 'playerJoined':
                if (currentLobbyId && data.lobbyId === currentLobbyId) {
                    console.log(`[LobbyService] Player ${data.player?.userId} joined lobby ${data.lobbyId}`);
                    // update participant list UI
                }
                break;

            case 'playerLeft':
                if (currentLobbyId && data.lobbyId === currentLobbyId) {
                    console.log(`[LobbyService] Player ${data.userId} left lobby ${data.lobbyId}`);
                    // update participant list UI
                }
                break;


            case 'gameStarted':
                if (currentLobbyId && data.lobbyId === currentLobbyId) {
                    console.log(`[LobbyService] Game started in lobby ${data.lobbyId}. Game ID: ${data.gameId}`);
                    // Navigate to game page, e.g., Router.redirect(`/game/${data.gameId}`);
                }
                break;

            default:
                // console.log("[LobbyService] Received unhandled message type:", data.type);
                break;
        }
    }

    private setupUIEventListeners(): void {
        document.body.removeEventListener('click', this.handleLobbyPageClick);
        document.body.addEventListener('click', this.handleLobbyPageClick);
    }

    private async handleLobbyPageClick(e: MouseEvent): Promise<void> {
        const currentLobbyId = this.getCurrentLobbyIdFromUrl();
        if (!currentLobbyId && !window.location.pathname.startsWith("/lobby/")) {
            return;
        }

        const target = e.target as HTMLElement;

        // Start Game Button
        const startGameBtn = target.closest('#startGameBtn');
        if (startGameBtn) {
            e.preventDefault();
            if (!this.messageHandler || !this.userService) {
                console.warn("LobbyService: Cannot handle Start Game. Dependencies missing.");
                return;
            }
            const currentUser = await UserService.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                console.warn("LobbyService: Current user not found for marking ready.");
                return;
            }
            console.log(`[LobbyService] User ${currentUser.id} clicked ready for lobby ${currentLobbyId}`);
            this.messageHandler.markReady(currentUser.id.toString(), currentLobbyId);
            return;
        }

        // Leave Lobby Button
        const leaveBtn = target.closest('#leaveBtn');
        if (leaveBtn) {
            e.preventDefault();
            if (currentLobbyId && this.messageHandler) {
                console.log(`[LobbyService] Leaving lobby ${currentLobbyId}`);
                this.messageHandler.leaveLobby(currentLobbyId);
                // Router.redirect('/lobbies'); // Or wherever you want to go after leaving
            }
            return;
        }
    }


    //messagehandler??
    public getCurrentLobbyData(): LobbyInfo | undefined {
        const lobbyId = this.getCurrentLobbyIdFromUrl();
        if (!lobbyId) return undefined;
        if (this.currentLobbyData && this.currentLobbyData.id === lobbyId) {
            return this.currentLobbyData;
        }
        return undefined;
    }

    public destroy(): void {
        if (this.socket) {
            this.socket.removeEventListener('message', this.handleSocketMessage);
        }
        document.body.removeEventListener('click', this.handleLobbyPageClick);
        this.isInitialized = false;
        this.currentLobbyData = undefined;
    }
}
