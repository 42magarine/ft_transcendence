import { IServerMessage, ILobbyState } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';
import UserService from './UserService.js';

export default class LobbyService {
    private lobbyState!: ILobbyState;

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
                    if (this.lobbyState) {
                        if (this.lobbyState.lobbyPlayers) {
                            if (this.lobbyState.lobbyPlayers[0].isReady && this.lobbyState.lobbyPlayers[1].isReady) {
                                window.messageHandler.joinGame(this.lobbyState.lobbyId, this.lobbyState.lobbyPlayers[0], this.lobbyState.lobbyPlayers[1]);
                                Router.redirect(`/pong/${this.lobbyState.lobbyId}`);
                            }
                        }
                    }
                }
                break;
            case 'gameJoined':
                // Router.redirect(`/pong/${this.lobbyState.lobbyId}`);
                break;
            default:
                break;
        }
    }

    public setupEventListener(): void {
        const startButton = document.getElementById('startGameBtn');
        if (startButton) {
            startButton.addEventListener('click', this.handleStartGameClick);
        }

        const leaveButton = document.getElementById('leaveBtn');
        if (leaveButton) {
            leaveButton.addEventListener('click', this.handleLeaveLobbyClick);
        }
    }

    public handleStartGameClick = async (e: MouseEvent): Promise<void> => {
        e.preventDefault();
        const currentLobbyId = this.getCurrentLobbyIdFromUrl();
        if (!currentLobbyId) {
            console.warn("[LobbyService] Cannot start game: current lobby ID not found.");
            return;
        }

        window.messageHandler!.markReady(this.lobbyState.lobbyId, window.currentUser!.id!);
        return;
    }

    public handleLeaveLobbyClick = async (e: MouseEvent): Promise<void> => {
        e.preventDefault();
        Router.redirect(`/lobbylist`);
        return;
    }

    public getLobby(): ILobbyState {
        return this.lobbyState;
    }
}
