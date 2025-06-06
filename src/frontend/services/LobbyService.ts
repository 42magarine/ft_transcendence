// LobbyService.ts - Fixed version with proper leave handling
import { IServerMessage, ILobbyState } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';
import UserService from './UserService.js';

export default class LobbyService {
    private lobbyState!: ILobbyState;
    private lobbyDataResolvers: ((lobby: ILobbyState) => void)[] = [];
    private isInitialized = false;

    constructor() {
        this.handleSocketMessage = this.handleSocketMessage.bind(this);
        this.handleLobbyPageClick = this.handleLobbyPageClick.bind(this);
    }

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
                    console.log('Received lobbyState:', data.lobby);
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

            case 'playerJoined':
                if (data.lobby) {
                    console.log('Player joined lobby:', data.lobby);
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
                    console.log('Player left lobby:', data.lobby);
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
                    console.log('Player ready state changed:', data.lobby);
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

            case 'leftLobby':
                // Only redirect if this user left the lobby
                console.log('Received leftLobby confirmation', data);
                if (data.userId && window.currentUser && data.userId === window.currentUser.id) {
                    console.log('This user left the lobby, redirecting to lobby list');
                    if (window.location.pathname.includes('/lobby/')) {
                        Router.redirect('/lobbylist');
                    }
                } else {
                    console.log('Another user left the lobby, staying on current page');
                }
                break;

            default:
                break;
        }
    }

    public async handleLobbyPageClick(e: MouseEvent): Promise<void> {
        console.log("handleLobbyPageClick");
        const currentLobbyId = this.getCurrentLobbyIdFromUrl();
        if (!currentLobbyId || !window.location.pathname.startsWith("/lobby/")) return;

        const target = e.target as HTMLElement;

        // Handle ready button click
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

            try {
                await window.messageHandler!.markReady(currentLobbyId, currentUser.id);
            } catch (error) {
                console.error("[LobbyService] Error marking player ready:", error);
            }
            return;
        }

        // Handle leave button click
        const leaveBtn = target.closest('#leaveBtn');
        if (leaveBtn) {
            e.preventDefault();
            console.log("Leave button clicked, leaving lobby:", currentLobbyId);

            try {
                // Send leave lobby message to backend
                await window.messageHandler!.leaveLobby(currentLobbyId);

                // Don't redirect immediately - wait for the leftLobby confirmation
                // The redirect will happen in the socket message handler
                console.log("Leave lobby message sent, waiting for confirmation...");

            } catch (error) {
                console.error("[LobbyService] Error leaving lobby:", error);
                // If there's an error, fallback to direct redirect
                Router.redirect('/lobbylist');
            }
            return;
        }
    }

    public getLobby(): ILobbyState {
        return this.lobbyState;
    }

    public hasLobby(): boolean {
        return !!this.lobbyState;
    }
}