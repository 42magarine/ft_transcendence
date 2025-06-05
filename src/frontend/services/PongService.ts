import { IServerMessage, ILobbyState, IGameState, IPlayerState } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';
import UserService from './UserService.js';

export default class PongService {
    private gameState!: IGameState;
    private player1!: IPlayerState;
    private player2!: IPlayerState;
    constructor() {

        this.handleSocketMessage = this.handleSocketMessage.bind(this);
        this.setupUIEventListeners();

        if (window.ft_socket) {
            window.ft_socket.addEventListener('message', this.handleSocketMessage);
        } else {
            console.error("[LobbyService] window.ft_socket is not initialized when LobbyService is constructed.");
        }
    }

    private getCurrentLobbyIdFromUrl(): string {
        const match = window.location.pathname.match(/\/pong\/([^/]+)/);
        return match?.[1] || '';
    }

    private handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);
        const currentUrlLobbyId = this.getCurrentLobbyIdFromUrl();
        console.log("frontend received:" + data.type)
        switch (data.type) {
            case 'gameState':
                if (data.lobbyId === currentUrlLobbyId) {
                    this.gameState = data.gameState;
                    // Router.update(); ?
                }
                break;

            case 'gameJoined':
                if (data.lobbyId === currentUrlLobbyId) {
                    this.gameState = data.gameState;
                    this.player1 = data.player1;
                    this.player2 = data.player2;
                    //countdown
                    // Router.update(); ?
                    window.messageHandler.startGame(currentUrlLobbyId);
                }
                break;
            case 'gameStarted':
                break;
            default:
                break;
        }
    }

    private setupUIEventListeners(): void {

    }

    public getLobby(): IGameState {
        return this.gameState;
    }

    public getPlayer1(): IPlayerState {
        return this.player1;
    }

    public getPlayer2(): IPlayerState {
        return this.player1;
    }

    public destroy(): void {
        if (window.ft_socket) {
            window.ft_socket.removeEventListener('message', this.handleSocketMessage);
        }

        //console.log('[LobbyService] Destroyed. No longer listening to global socket.');
    }
}
