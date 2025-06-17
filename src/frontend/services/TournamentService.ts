import { IServerMessage, ILobbyState, IPlayerState } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';
import UserService from './UserService.js';

export default class TournamentService {
    private lobbyState!: ILobbyState;
    private matchWinMessage!: string;
    private matchScoreMessage!: string;
    private getCurrentLobbyIdFromUrl(): string {
        const match = window.location.pathname.match(/\/tournament\/([^/]+)/);
        return match?.[1] || '';
    }

    public handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);
        const currentUrlTournamentId = this.getCurrentLobbyIdFromUrl();
        // console.log("LobbyService msg received: " + data)
        switch (data.type) {
            case 'lobbyState':
                if (data.lobby && data.lobby.lobbyType === 'tournament') {
                    console.log(data.lobby)
                    const receivedLobbyInfo: ILobbyState = {
                        ...data.lobby,
                        createdAt: new Date(data.lobby.createdAt),
                        lobbyPlayers: data.lobby.lobbyPlayers || []
                    };

                    if (receivedLobbyInfo.lobbyId === currentUrlTournamentId) {
                        this.lobbyState = receivedLobbyInfo;
                    }
                }
            case 'playerJoined':
                if (data.lobby && data.lobby.lobbyType === 'tournament') {
                    console.log(data.lobby)
                    const receivedLobbyInfo: ILobbyState = {
                        ...data.lobby,
                        createdAt: new Date(data.lobby.createdAt),
                        lobbyPlayers: data.lobby.lobbyPlayers || []
                    };

                    if (receivedLobbyInfo.lobbyId === currentUrlTournamentId) {
                        this.lobbyState = receivedLobbyInfo;
                        Router.update();
                    }
                }
                break;
            case 'playerLeft':
                if (data.lobby && data.lobby.lobbyType === 'tournament') {
                    console.log(data.lobby)
                    const receivedLobbyInfo: ILobbyState = {
                        ...data.lobby,
                        createdAt: new Date(data.lobby.createdAt),
                        lobbyPlayers: data.lobby.lobbyPlayers || []
                    };

                    if (receivedLobbyInfo.lobbyId === currentUrlTournamentId) {
                        this.lobbyState = receivedLobbyInfo;
                        Router.update();
                    }
                }
                break;
            case 'playerReady':
                if (data.lobby && data.lobby.lobbyType === 'tournament') {
                    console.log(data.lobby)
                    const receivedLobbyInfo: ILobbyState = {
                        ...data.lobby,
                        createdAt: new Date(data.lobby.createdAt),
                        lobbyPlayers: data.lobby.lobbyPlayers || []
                    };

                    if (receivedLobbyInfo.lobbyId === currentUrlTournamentId) {
                        this.lobbyState = receivedLobbyInfo;
                        Router.update();
                    }
                }
                break;

            case 'tournamentMatchStart':
                if (data.lobby && data.lobby.lobbyType === 'tournament') {
                    if (data.player1Name === window.currentUser?.name || data.player2Name === window.currentUser?.name) {
                        Router.redirect(`/pong/${data.lobby.lobbyId}/${data.matchId}`);
                    }

                }
            case "tournamentCancelled":
                //placeholder redirect to lobbylist, lobby will be deleted
                //maybe need 2nd case? idk
                break;
            case "tournamentFinished":
                Router.redirect(`/tournamentwinner`);
                break;
            case "tournamentMatchOver":
                if (data.player1Name === window.currentUser?.name || data.player2Name === window.currentUser?.name) {
                    if (data.player1Name === window.currentUser?.name) {
                        if (data.player1Score! > data.player2Score!) {
                            this.matchWinMessage = data.player1Name + " won against " + data.player2Name
                            this.matchScoreMessage = "Score: " +  data.player1Score + " : " + data.player2Score
                        }
                        else {
                            this.matchWinMessage = data.player2Name + " won against " + data.player1Name
                            this.matchScoreMessage = "Score: " +  data.player2Score + " : " + data.player1Score
                        }
                    }
                    Router.redirect(`/tournamentwaitingroom`);
                }
                break;
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
        const currentTournamentId = this.getCurrentLobbyIdFromUrl();
        if (!currentTournamentId) {
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

    public getMatchWinMessage(): string {
        return this.matchWinMessage;
    }

    public getMatchScoreMessage(): string {
        return this.matchScoreMessage;
    }
}
