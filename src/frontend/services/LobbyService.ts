import { IServerMessage, ILobbyState, IPlayerState} from '../../interfaces/interfaces.js';
import MessageHandlerService from './MessageHandlerService.js';
import UserService from './UserService.js';


export default class LobbyService {
    private currentLobbyData?: ILobbyState;
    private socket?: WebSocket;

    private messageHandler!: MessageHandlerService;
    private userService!: UserService;
    private isInitialized: boolean = false;

    private currentLobbyPromiseResolver: ((value: ILobbyState) => void) | null = null;
    private idForCurrentPromise: string | null = null;
    private player1: IPlayerState | null = null;
    private player2: IPlayerState | null = null;

    constructor() {
        this.handleSocketMessage = this.handleSocketMessage.bind(this);
        this.handleLobbyPageClick = this.handleLobbyPageClick.bind(this);
    }

    private getCurrentLobbyIdFromUrl(): string {
        const match = window.location.pathname.match(/\/lobby\/([^/]+)/);
        return match?.[1] || '';
    }

    public init(socket: WebSocket, messageHandler: MessageHandlerService, userService: UserService): void {
        if (this.isInitialized && this.socket === socket) {
            this.setupUIEventListeners();
            return;
        }

        this.socket = socket;
        this.messageHandler = messageHandler;
        this.userService = userService;

        this.socket.removeEventListener('message', this.handleSocketMessage);
        this.socket.addEventListener('message', this.handleSocketMessage);

        this.setupUIEventListeners();
        this.isInitialized = true;

        this.player1 = null;
        this.player2 = null;

        if (this.currentLobbyPromiseResolver) {
            console.warn('[LobbyService init] A pending getCurrentLobbyData() promise was orphaned because the service is re-initializing.');
            this.currentLobbyPromiseResolver = null;
        }
        this.idForCurrentPromise = null;
    }

    private handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);
        const currentUrlLobbyId = this.getCurrentLobbyIdFromUrl();
        console.log(data.type)
        switch (data.type) {
            case 'lobbyInfo':
                if (data.lobby) {
                    const receivedLobbyInfo: ILobbyState = {
                        ...data.lobby,
                        createdAt: new Date(data.lobby.createdAt)
                    };

                    if (this.idForCurrentPromise === receivedLobbyInfo.id && this.currentLobbyPromiseResolver) {
                        console.log(`[LobbyService] Received data for pending promise ${receivedLobbyInfo.id}. Updating currentLobbyData and resolving promise.`);
                        this.currentLobbyData = receivedLobbyInfo;
                        this.currentLobbyPromiseResolver(receivedLobbyInfo);
                        this.currentLobbyPromiseResolver = null;
                        this.idForCurrentPromise = null;
                    }
                    if (receivedLobbyInfo.id === currentUrlLobbyId) {
                        this.currentLobbyData = receivedLobbyInfo;
                    }
                }
                break;

            case 'playerReady':
                if (currentUrlLobbyId && data.lobbyId === currentUrlLobbyId && data.userId !== undefined && typeof data.isReady === 'boolean') {
                    if (this.player1 && this.player1.userId === data.userId) this.player1.isReady = data.isReady;
                    else if (this.player2 && this.player2.userId === data.userId) this.player2.isReady = data.isReady;
                }
                break;

            case 'allPlayersReady':
                if (currentUrlLobbyId && data.lobbyId === currentUrlLobbyId)
                    console.log("[LobbyService] All players are ready!");
                break;

            case 'playerJoined':
                if (currentUrlLobbyId && data.lobbyId === currentUrlLobbyId) {
                    const { playerNumber, userId, userName, isReady } = data;

                    if (playerNumber !== undefined && userId !== undefined) {

                        const IPlayerState: IPlayerState = {
                            playerNumber: playerNumber,
                            userId: userId,
                            userName: userName,
                            isReady: isReady
                        };

                        if (playerNumber === 1) {
                            this.player1 = IPlayerState;
                            console.log("Player 1 updated:", this.player1);
                        } else if (playerNumber === 2) {
                            this.player2 = IPlayerState;
                            console.log("Player 2 updated:", this.player2);
                        } else {
                            console.warn("Received playerJoined for unexpected playerNumber:", playerNumber);
                        }
                    } else {
                        console.warn("Received incomplete playerJoined data:", data);
                    }
                }
                break;

            case 'playerLeft':
                if (currentUrlLobbyId && data.lobbyId === currentUrlLobbyId && data.playerInfo) {
                    const { playerNumber } = data.playerInfo;
                    if (playerNumber === 1) this.player1 = null;
                    else if (playerNumber === 2) this.player2 = null;
                }
                break;

            case 'gameStarted':
                if (currentUrlLobbyId && data.lobbyId === currentUrlLobbyId) {
                    console.log(`[LobbyService] Game started in lobby ${data.lobbyId}. Game ID: ${data.gameId}`);
                }
                break;

            default:
                break;
        }
    }

    private setupUIEventListeners(): void {
        document.body.removeEventListener('click', this.handleLobbyPageClick);
        document.body.addEventListener('click', this.handleLobbyPageClick);
    }

    private async handleLobbyPageClick(e: MouseEvent): Promise<void> {
        const currentLobbyId = this.getCurrentLobbyIdFromUrl();
        if (!currentLobbyId || !window.location.pathname.startsWith("/lobby/")) return;

        const target = e.target as HTMLElement;
        const startGameBtn = target.closest('#startGameBtn');
        if (startGameBtn) {
            e.preventDefault();
            if (!this.messageHandler || !this.userService || !currentLobbyId) return;
            const currentUser = await UserService.getCurrentUser();
            if (!currentUser || !currentUser.id) return;
            this.messageHandler.markReady(currentUser.id.toString(), currentLobbyId);
            return;
        }

        const leaveBtn = target.closest('#leaveBtn');
        if (leaveBtn) {
            e.preventDefault();
            if (this.messageHandler && currentLobbyId) {
                this.messageHandler.leaveLobby(currentLobbyId);
            }
            return;
        }
    }

    public async getCurrentLobbyData(): Promise<ILobbyState> {
        const lobbyIdFromUrl = this.getCurrentLobbyIdFromUrl();
        if (!this.messageHandler || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn("[LobbyService] getCurrentLobbyData: Dependencies (MessageHandler/Socket) not ready or socket not open.")
        }

        const promise = new Promise<ILobbyState>((resolve) => {
            this.currentLobbyPromiseResolver = resolve;
            this.idForCurrentPromise = lobbyIdFromUrl;
        });

        try {
            await this.messageHandler.requestLobbyById(lobbyIdFromUrl);
        } catch (error) {
            if (this.currentLobbyData && this.currentLobbyData.id === lobbyIdFromUrl && this.currentLobbyPromiseResolver) {
                console.warn(`[LobbyService getCurrentLobbyData] Resolving with STALE/CACHED data for ${lobbyIdFromUrl} due to request send error.`);
                this.currentLobbyPromiseResolver(this.currentLobbyData);
                this.currentLobbyPromiseResolver = null;
                this.idForCurrentPromise = null;
            }
        }

        return promise;
    }

    public getPlayer1(): IPlayerState | null { return this.player1; }
    public getPlayer2(): IPlayerState | null { return this.player2; }

    public destroy(): void {
        if (this.socket) {
            this.socket.removeEventListener('message', this.handleSocketMessage);
        }
        document.body.removeEventListener('click', this.handleLobbyPageClick);

        if (this.currentLobbyPromiseResolver) {
            this.currentLobbyPromiseResolver = null;
        }
        this.idForCurrentPromise = null;

        this.isInitialized = false;
        this.currentLobbyData = undefined;
        this.player1 = null;
        this.player2 = null;

        console.log('[LobbyService] Destroyed.');
    }
}
