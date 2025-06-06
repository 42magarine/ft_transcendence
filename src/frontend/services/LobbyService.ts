import { IServerMessage, ILobbyState } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';
import UserService from './UserService.js';

export default class LobbyService {
    private lobbyState!: ILobbyState;
    private lobbyDataResolvers: ((lobby: ILobbyState) => void)[] = [];
    private isInitialized = false;

    private getCurrentLobbyIdFromUrl(): string {
        const match = window.location.pathname.match(/\/lobby\/([^/]+)/);
        return match?.[1] || '';
    }

    public handleSocketMessage(event: MessageEvent<string>): void {
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
                    }
                }
            case 'playerJoined':
                if (data.lobby) {
                    console.log(data.lobby)
                    const receivedLobbyInfo: ILobbyState = {
                        ...data.lobby,
                        createdAt: new Date(data.lobby.createdAt),
                        lobbyPlayers: data.lobby.lobbyPlayers || []
                    };

                    if (receivedLobbyInfo.lobbyId === currentUrlLobbyId) {
                        this.lobbyState = receivedLobbyInfo;
                        Router.update();
                    }
                }
                break;
            case 'playerLeft':
                if (data.lobby) {
                    console.log(data.lobby)
                    const receivedLobbyInfo: ILobbyState = {
                        ...data.lobby,
                        createdAt: new Date(data.lobby.createdAt),
                        lobbyPlayers: data.lobby.lobbyPlayers || []
                    };

                    if (receivedLobbyInfo.lobbyId === currentUrlLobbyId) {
                        this.lobbyState = receivedLobbyInfo;
                        Router.update();
                    }
                }
                break;
            case 'playerReady':
                if (data.lobby) {
                    console.log(data.lobby)
                    const receivedLobbyInfo: ILobbyState = {
                        ...data.lobby,
                        createdAt: new Date(data.lobby.createdAt),
                        lobbyPlayers: data.lobby.lobbyPlayers || []
                    };

                    if (receivedLobbyInfo.lobbyId === currentUrlLobbyId) {
                        this.lobbyState = receivedLobbyInfo;
                        Router.update();
                    }
                }
                break;
            default:
                break;
        }
    }

    public async handleLobbyPageClick(e: MouseEvent): Promise<void> {
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
            Router.redirect(`/lobbylist`);
            return;
        }
    }

    public getLobby(): ILobbyState {
        return this.lobbyState;
    }
}
