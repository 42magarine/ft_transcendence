import { IServerMessage, ILobbyState, IPlayerState } from '../../interfaces/interfaces.js';
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
        // console.log("LobbyService msg received: " + data)
        switch (data.type) {
            case 'lobbyState':
                if (data.lobby && data.lobby.lobbyType === 'game') {
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
                if (data.lobby && data.lobby.lobbyType === 'game') {
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
                if (data.lobby && data.lobby.lobbyType === 'game') {
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
                if (data.lobby && data.lobby.lobbyType === 'game') {
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
                    // if (this.lobbyState) {
                    //     const { lobbyType, lobbyPlayers, lobbyId } = this.lobbyState;

                    //     if (lobbyType === 'game' && lobbyPlayers && this.arePlayersReady(lobbyPlayers, 2)) {
                    //         window.messageHandler.joinGame(lobbyId, lobbyPlayers);
                    //         Router.redirect(`/pong/${lobbyId}`);
                    //     }

                    //     if (lobbyType === 'tournament' && lobbyPlayers) {
                    //         if (lobbyPlayers.length === 4 && this.arePlayersReady(lobbyPlayers, 4)) {
                    //             window.messageHandler.joinGame(lobbyId, lobbyPlayers);
                    //             Router.redirect(`/pong/${lobbyId}`);
                    //         } else if (lobbyPlayers.length === 8 && this.arePlayersReady(lobbyPlayers, 8)) {
                    //             window.messageHandler.joinGame(lobbyId, lobbyPlayers);
                    //             Router.redirect(`/pong/${lobbyId}`);
                    //         }
                    //     }
                    // }
                }
                break;
            case 'gameStarted':
                if (data.lobby && data.gameState && data.matchId)
                {
                    const receivedLobbyInfo: ILobbyState = {
                        ...data.lobby,
                        createdAt: new Date(data.lobby.createdAt),
                        lobbyPlayers: data.lobby.lobbyPlayers || []
                    }

                    if (receivedLobbyInfo.lobbyId === currentUrlLobbyId)
                    {
                        this.lobbyState = receivedLobbyInfo;
                        Router.update();
                    }
                    Router.redirect(`/pong/${data.lobby.lobbyId}/${data.matchId}`)
                }
            default:
                break;
        }
    }

    public arePlayersReady(players: IPlayerState[], count: number): boolean {
        return players.length >= count && players.slice(0, count).every(player => player.isReady);
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
