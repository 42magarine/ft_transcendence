import { IServerMessage, ILobbyState } from '../../interfaces/interfaces.js';
import MessageHandlerService from './MessageHandlerService.js';
import UserService from './UserService.js';

export default class LobbyService {
    private lobbyState!: ILobbyState;
    private socket?: WebSocket;
    private messageHandler: MessageHandlerService;
    private userService: UserService; // Now required in constructor
    private lobbyDataResolvers: ((lobby: ILobbyState) => void)[] = [];

    constructor() {
        this.messageHandler = window.messageHandler;
        this.userService = window.userService;

        this.handleSocketMessage = this.handleSocketMessage.bind(this);
        this.handleLobbyPageClick = this.handleLobbyPageClick.bind(this);
        this.setupUIEventListeners();

        console.log('[LobbyService] Core dependencies initialized.');
    }

    public connectSocket(socket: WebSocket): void {
        if (this.socket === socket && this.socket.readyState === WebSocket.OPEN) {
            return;
        }

        if (this.socket) {
            this.socket.removeEventListener('message', this.handleSocketMessage);
        }

        this.socket = socket;
        this.socket.addEventListener('message', this.handleSocketMessage);
    }

    /**
     * Disconnects the current WebSocket from the service.
     */
    public disconnectSocket(): void {
        if (this.socket) {
            this.socket.removeEventListener('message', this.handleSocketMessage);
            this.socket = undefined;
            console.log('[LobbyService] Socket disconnected.');
        }
    }

    private getCurrentLobbyIdFromUrl(): string {
        const match = window.location.pathname.match(/\/lobby\/([^/]+)/);
        return match?.[1] || '';
    }

    private handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);
        const currentUrlLobbyId = this.getCurrentLobbyIdFromUrl();
        console.log("frontend msg received: " + data.type)
        switch (data.type) {
            case 'lobbyState':
                if (data.lobby) {
                    const receivedLobbyInfo: ILobbyState = {
                        ...data.lobby,
                        createdAt: new Date(data.lobby.createdAt),
                        lobbyPlayers: data.lobby.lobbyPlayers || []
                    };

                    // Update general cache if it's the current lobby
                    if (receivedLobbyInfo.lobbyId === currentUrlLobbyId) {
                        this.lobbyState = receivedLobbyInfo;
                        // console.log(`[LobbyService] Main lobbyState for ${currentUrlLobbyId} updated.`);
                    }
                }
                break;
            // ... other cases
            default:
                break;
        }
    }

    private setupUIEventListeners(): void {
        document.body.removeEventListener('click', this.handleLobbyPageClick);
        document.body.addEventListener('click', this.handleLobbyPageClick);
    }

    private async handleLobbyPageClick(e: MouseEvent): Promise<void> {
        const currentLobbyId = this.getCurrentLobbyIdFromUrl();
        if (!currentLobbyId || !window.location.pathname.startsWith("/lobby/")) return;

        const target = e.target as HTMLElement;
        const startGameBtn = target.closest('#startGameBtn');
        if (startGameBtn) {
            e.preventDefault();
            // messageHandler and userService are now guaranteed to be available
            if (!currentLobbyId) { // Still check currentLobbyId
                console.warn("[LobbyService] Cannot start game: current lobby ID not found.");
                return;
            }
            const currentUser = await UserService.getCurrentUser(); // Assuming this is a static method
            if (!currentUser || !currentUser.id) {
                console.warn("[LobbyService] Cannot start game: current user not found.");
                return;
            }
            this.messageHandler.markReady(currentLobbyId, currentUser.id);
            return;
        }

        const leaveBtn = target.closest('#leaveBtn');
        if (leaveBtn) {
            e.preventDefault();
            if (this.messageHandler && currentLobbyId) {
                this.messageHandler.leaveLobby(currentLobbyId);
            }
            return;
        }
    }

    private resolveLobbyDataPromises(lobbies: ILobbyState): void {
        this.lobbyDataResolvers.forEach(resolve => resolve(lobbies));
        this.lobbyDataResolvers = [];
    }

    public async getLobbyState(): Promise<ILobbyState> {
        const currentUrlLobbyId = this.getCurrentLobbyIdFromUrl();

        if (!window.messageHandler) {
            console.warn("LobbyListService getLobbies: messageHandler not found.");
            return Promise.resolve(this.lobbyState);
        }
        if (!window.ft_socket || window.ft_socket.readyState !== WebSocket.OPEN) {
            console.warn("LobbyListService getLobbies: WebSocket not open.");
            return Promise.resolve(this.lobbyState);
        }

        const promise = new Promise<ILobbyState>((resolve) => {
            this.lobbyDataResolvers.push(resolve);
        });

        try {
            await window.socketReady;
            await window.messageHandler.requestLobbyState(currentUrlLobbyId);
        }
        catch (error) {
            console.error("LobbyListService getLobbies: Error during socket readiness or requesting list:", error);
            this.resolveLobbyDataPromises(this.lobbyState);
        }

        return promise;
    }


    public destroy(): void {
        this.disconnectSocket(); // Use the dedicated disconnect method
        document.body.removeEventListener('click', this.handleLobbyPageClick);

        // No need to nullify messageHandler and userService, as they are constructor-injected
        // and their lifecycle is managed by whatever created LobbyService.

        console.log('[LobbyService] Destroyed.');
    }
}
