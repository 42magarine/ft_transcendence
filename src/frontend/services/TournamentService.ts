import { IServerMessage, ILobbyState, IPlayerState } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';
import UserService from './UserService.js';

export default class TournamentService {
    private lobbyState!: ILobbyState;
    private matchWinMessage!: string;
    private matchScoreMessage!: string;
    private tournamentWinnerMessage!: string;
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
                    // console.log(data.lobby)
                    const receivedLobbyInfo: ILobbyState = {
                        ...data.lobby,
                        createdAt: new Date(data.lobby.createdAt),
                        lobbyPlayers: data.lobby.lobbyPlayers || []
                    };

                    if (receivedLobbyInfo.lobbyId === currentUrlTournamentId) {
                        this.lobbyState = receivedLobbyInfo;
                    }
                }
                break;
            case 'playerJoined':
                if (data.lobby && data.lobby.lobbyType === 'tournament') {
                    // console.log(data.lobby)
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
                    // console.log(data.lobby)
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
                    if (data.player1Name === window.currentUser?.username || data.player2Name === window.currentUser?.username) {
                        Router.redirect(`/pong/${data.lobby.lobbyId}/${data.matchId}`);
                    }

                }
                break;
            case "tournamentFinished":
                this.tournamentWinnerMessage = data.winnerUserName!;

                Router.redirect(`/tournamentwinner`);
                setTimeout(() => {
                    if (/\/tournamentwinner/.test(window.location.pathname)) {
                        Router.redirect('/lobbylist');
                    }
                }, 15000);
                break;
            case "tournamentMatchOver":
                if (data.player1Name === window.currentUser?.username || data.player2Name === window.currentUser?.username) {
                    if (data.player1Score! > data.player2Score!) {
                        this.matchWinMessage = data.player1Name + " won against " + data.player2Name
                        this.matchScoreMessage = "Score: " + data.player1Score + " : " + data.player2Score
                    }
                    else if (data.player2Score! > data.player1Score!) {
                        this.matchWinMessage = data.player2Name + " won against " + data.player1Name
                        this.matchScoreMessage = "Score: " + data.player2Score + " : " + data.player1Score
                    } else {
                        this.matchWinMessage = "Its a tie! How do you even tie in Pong?";
                        this.matchScoreMessage = " ";
                    }
                    Router.redirect(`/tournamenttransition`);
                }
                break;
            case "tournamentCancelled":
                //placeholder redirect to lobbylist, lobby will be deleted
                //maybe need 2nd case? idk
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
            console.log("[LobbyService] Cannot start game: current lobby ID not found.");
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

    public getTournamentWinnerMessage(): string {
        return this.tournamentWinnerMessage;
    }
}
