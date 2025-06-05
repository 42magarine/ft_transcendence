import { IServerMessage, ILobbyState, IGameState } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';
import UserService from './UserService.js';

export default class PongService {
    private gameState!: IGameState;

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
        const match = window.location.pathname.match(/\/lobby\/([^/]+)/);
        return match?.[1] || '';
    }

    private handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);
        const currentUrlLobbyId = this.getCurrentLobbyIdFromUrl();
        console.log("frontend received:" + data.type)
        switch (data.type) {
            case 'gameState':
                break;

            case 'gameJoined':
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

    public destroy(): void {
        if (window.ft_socket) {
            window.ft_socket.removeEventListener('message', this.handleSocketMessage);
        }

        //console.log('[LobbyService] Destroyed. No longer listening to global socket.');
    }
}
