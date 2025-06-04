import { IServerMessage, ILobbyState } from '../../interfaces/interfaces.js';
import UserService from './UserService.js';

export default class LobbyService {
    private lobbyState!: ILobbyState;
    private lobbyDataResolvers: ((lobby: ILobbyState) => void)[] = [];

    constructor() {

        this.handleSocketMessage = this.handleSocketMessage.bind(this);
        this.handleLobbyPageClick = this.handleLobbyPageClick.bind(this);
        this.setupUIEventListeners();

        if (window.ft_socket) {
            window.ft_socket.addEventListener('message', this.handleSocketMessage);
        } else {
            console.error("[LobbyService] window.ft_socket is not initialized when LobbyService is constructed.");
        }
    }

    private getCurrentLobbyIdFromUrl(): string {
        const match = window.location.pathname.match(/\/lobby\/([^/]+)/);
        return match?.[1] || '';
    }

    private handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);
        const currentUrlLobbyId = this.getCurrentLobbyIdFromUrl();

        switch (data.type) {
            case 'lobbyState':
                if (data.lobby) {
                    console.log(data.lobby)
                    const receivedLobbyInfo: ILobbyState = {
                        ...data.lobby,
                        createdAt: new Date(data.lobby.createdAt),
                        lobbyPlayers: data.lobby.lobbyPlayers || []
                    };

                    if (receivedLobbyInfo.lobbyId === currentUrlLobbyId) {
                        this.lobbyState = receivedLobbyInfo;
                        this.resolveLobbyDataPromises(receivedLobbyInfo);
                    }
                }
                break;
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
            if (!currentLobbyId) {
                console.warn("[LobbyService] Cannot start game: current lobby ID not found.");
                return;
            }
            const currentUser = await UserService.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                console.warn("[LobbyService] Cannot start game: current user not found.");
                return;
            }
            window.messageHandler!.markReady(currentLobbyId, currentUser.id);
            return;
        }

        const leaveBtn = target.closest('#leaveBtn');
        if (leaveBtn) {
            e.preventDefault();
            if (window.messageHandler && currentLobbyId) {
                window.messageHandler.leaveLobby(currentLobbyId);
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
            console.warn("LobbyService getLobbyState: window.messageHandler not found.");
            return Promise.resolve(this.lobbyState);
        }
        if (!window.ft_socket || window.ft_socket.readyState !== WebSocket.OPEN) {
            console.warn("LobbyService getLobbyState: window.ft_socket not open.");
            return Promise.resolve(this.lobbyState);
        }

        const promise = new Promise<ILobbyState>((resolve) => {
            this.lobbyDataResolvers.push(resolve);
        });

        try {
            await window.messageHandler.requestLobbyState(currentUrlLobbyId);
        }
        catch (error) {
            console.error("LobbyService getLobbyState: Error during socket readiness or requesting list:", error);
            this.resolveLobbyDataPromises(this.lobbyState);
        }

        return promise;
    }

    public destroy(): void {
        if (window.ft_socket) {
            window.ft_socket.removeEventListener('message', this.handleSocketMessage);
        }
        document.body.removeEventListener('click', this.handleLobbyPageClick);

        console.log('[LobbyService] Destroyed. No longer listening to global socket.');
    }
}
