import UserService from './UserService.js';
import { ClientMessage, LobbyInfo, ServerMessage } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';

class LobbyService {
    private socket: any;
    private currentUser: any = null;
    private lobbyData: LobbyInfo[] = [];
    private onLobbyListUpdated: (() => void)[] = [];

    public initSocket() {
        const wsHost = window.location.host;
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.socket = new WebSocket(`${wsProtocol}//${wsHost}/api/game/wss`);

        this.fuckYouWebsocket(this.socket).then(() => {
            console.log('Connected to WebSocket server');
        });

        this.socket.addEventListener('message', (event: MessageEvent<string>) => {
            const data: ServerMessage = JSON.parse(event.data);

            if (data.type === 'lobbyCreated') {
                const lobbyId = data.lobbyId;
                if (lobbyId) {
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
                console.log('[LobbyService] Invite received:', lobbyId, userId);
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

    private fuckYouWebsocket(socket: WebSocket): Promise<void> {
        return new Promise((resolve, reject) => {
            if (socket.readyState === WebSocket.OPEN) {
                resolve();
            } else {
                socket.addEventListener('open', () => resolve(), { once: true });
                socket.addEventListener('error', () =>
                    reject(new Error('Websocket is shit fuck you websocket')), { once: true });
            }
        });
    }

    public safeSend(msg: ClientMessage) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(msg));
        } else {
            console.warn('Tried to send message but socket not open:', msg);
        }
    }

    public setupEventListeners() {
        const createBtn = document.getElementById('createLobbyBtn') as HTMLElement | null;
        if (createBtn) {
            createBtn.addEventListener('click', async (e) => {
                e.preventDefault();

                // Call the service method to create a lobby (uses existing WebSocket logic)
                this.createLobby();
            });
        }
    }

    public async createLobby() {
        this.currentUser = await UserService.getCurrentUser();
        if (!this.currentUser) {
            return;
        }

        const msg: ClientMessage = {
            type: 'createLobby',
            userId: this.currentUser.id,
        };
        this.safeSend(msg);
    }

    public async joinGame(lobbyId: string) {
        const msg = {
            type: 'joinLobby',
            lobbyId,
        };
        this.safeSend(msg);
    }

    public getLobbyList(): LobbyInfo[] {
        return this.lobbyData || [];
    }

    public initialize(): void {
        document.addEventListener('RouterContentLoaded', () => {
            this.initSocket();
            this.setupEventListeners();
        });
    }

    public startGame(lobbyId: string) {
        const msg: ClientMessage = {
            type: 'startGame',
            lobbyId,
        };
        this.safeSend(msg);
    }

    public markReady(userID: string, lobbyId: string) {
        const msg: ClientMessage = {
            type: 'playerReady',
            userID,
            lobbyId,
        };
        this.safeSend(msg);
    }

    public leaveLobby(lobbyId: string) {
        const msg: ClientMessage = {
            type: 'leaveLobby',
            lobbyId,
        };
        this.safeSend(msg);
    }

    public sendInvite(userID: string, lobbyId: string) {
        const msg: ClientMessage = {
            type: 'sendInvite',
            userID,
            lobbyId,
        };
        this.safeSend(msg);
    }

    public acceptInvite(userID: string, lobbyId: string) {
        const msg: ClientMessage = {
            type: 'acceptInvite',
            userID,
            lobbyId,
        };
        this.safeSend(msg);
    }
}

const lobbyService = new LobbyService();
lobbyService.initialize();
export default lobbyService;
