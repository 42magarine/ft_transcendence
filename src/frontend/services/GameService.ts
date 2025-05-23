declare global {
    interface Window {
        ft_socket?: WebSocket;
        socketReady?: Promise<void>;
    }
}

import UserService from './UserService.js';
import MessageHandlerService from './MessageHandlerService.js';
import LobbyListService from './LobbyListService.js';
import LobbyService from './LobbyService.js';
import { ServerMessage } from '../../interfaces/interfaces.js';

class GameService {
    private socket!: WebSocket;
    private socketReady: Promise<void> = Promise.resolve();
    private userService: UserService;
    private messageHandler!: MessageHandlerService;
    private lobbyListService = new LobbyListService();
    private lobbyService = new LobbyService();

    constructor() {
        this.userService = new UserService();
    }

    public initialize(): void {
        document.addEventListener('RouterContentLoaded', () => {
            console.log("router load")
            window.socketReady?.then(() => {
                console.log("this socketReady")
                this.lobbyListService.setupEventListeners();
                this.lobbyService.setupEventListeners();
            }).catch(err => {
                console.error("Failed to setup service event listeners due to WebSocket readiness issue:", err);
            });
        });
    }

    public get message() {
        return this.messageHandler;
    }

    public get lobbyList() {
        return this.lobbyListService;
    }

    public get lobby() {
        return this.lobbyService;
    }

    public get user() {
        return this.userService;
    }
}

const gameService = new GameService();
gameService.initialize();
export default gameService;
