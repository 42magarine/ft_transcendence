import UserService from './UserService.js';
import MessageHandlerService from './MessageHandlerService.js';
import { ClientMessage, LobbyInfo, ServerMessage } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';

class GameService {
    private socket!: WebSocket;
    private socketReady: Promise<void> = Promise.resolve();
    private userService: UserService;
    private messageHandler!: MessageHandlerService;
    private currentUser: any = null;
    private lobbyData: LobbyInfo[] = [];
    private onLobbyListUpdated: (() => void)[] = [];

    constructor() {
        this.userService = new UserService();
    }

    public initSocket() {
        this.socket = new WebSocket("wss://localhost:3000/game/wss");
        this.socketReady = this.webSocketWrapper(this.socket).then(() => {
            console.log('Connected to WebSocket server');
        }).catch((err) => {
            console.error('WebSocket connection error:', err);
        });

        this.messageHandler = new MessageHandlerService(this.socket, this.socketReady, this.userService);

        this.socket.addEventListener('message', (event: MessageEvent<string>) => {
            const data: ServerMessage = JSON.parse(event.data);

            if (data.type === 'lobbyCreated') {
                const lobbyId = data.lobbyId;
                if (lobbyId) {
                    this.messageHandler.requestLobbyList();
                    Router.redirect(`/lobby/${lobbyId}`);
                }
            }

            if (data.type === 'lobbyList') {
                this.lobbyData = data.lobbies!;
                this.onLobbyListUpdated.forEach(cb => cb());
            }

            if (data.type === 'playerJoined') {
                const lobbyId = data.lobbyId;
                if (window.location.pathname === `/lobby/${lobbyId}`) {
                    const liveUpdateEvent = new CustomEvent('LobbyPlayerJoined', {
                        bubbles: true,
                        detail: { lobbyId }
                    });
                    document.dispatchEvent(liveUpdateEvent);
                }
            }

            if (data.type === 'gameStarted') {
                const lobbyId = data.lobbyId;
                if (lobbyId) {
                    window.history.pushState({}, '', `/pong/${lobbyId}`);
                    document.dispatchEvent(new Event('popstate'));
                }
            }

            if (data.type === 'inviteReceived') {
                const { lobbyId, userId } = data;
                document.dispatchEvent(new CustomEvent('LobbyInviteReceived', {
                    bubbles: true,
                    detail: { lobbyId, userId }
                }));
            }
        });
    }

    public registerLobbyListListener(callback: () => void) {
        this.onLobbyListUpdated.push(callback);
    }

    private webSocketWrapper(socket: WebSocket): Promise<void> {
        return new Promise((resolve, reject) => {
            if (socket.readyState === WebSocket.OPEN) {
                resolve();
            } else {
                socket.addEventListener('open', () => resolve(), { once: true });
                socket.addEventListener('error', () =>
                    reject(new Error('WebSocket connection failed')), { once: true });
            }
        });
    }

    public initialize(): void {
        document.addEventListener('RouterContentLoaded', () => {
            this.initSocket();
            this.setupEventListeners();
        });
    }

    public setupEventListeners() {
        const createBtn = document.getElementById('createLobbyBtn') as HTMLElement | null;
        if (createBtn) {
            createBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                this.messageHandler.createLobby();
            });
        }
    }

    public getLobbyList(): LobbyInfo[] {
        return this.lobbyData || [];
    }

    public get message() {
        return this.messageHandler;
    }
}

const gameService = new GameService();
gameService.initialize();
export default gameService;
