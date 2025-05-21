import { ServerMessage, LobbyInfo } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';
import MessageHandlerService from './MessageHandlerService.js';

export default class LobbyService {
    private lobbyData: LobbyInfo[] = [];
    private currentLobbyData?: LobbyInfo;
    private lobbyId: string;

    private updateCallbacks: (() => void)[] = [];
    private messageHandler!: MessageHandlerService;

    constructor() {
        const match = window.location.pathname.match(/\/lobby\/([^/]+)/);
        this.lobbyId = match?.[1] || '';
        this.messageHandler.requestLobbyList();
    }
    public init(socket: WebSocket, messageHandler: MessageHandlerService): void {
        this.messageHandler = messageHandler;

        socket.addEventListener('message', (event: MessageEvent<string>) => {
            const data: ServerMessage = JSON.parse(event.data);

            switch (data.type) {
                case 'lobbyList':
                    this.lobbyData = data.lobbies || [];
                    this.currentLobbyData = this.getCurrentLobby();
                    this.updateCallbacks.forEach(cb => cb());
                    break;

                case 'playerJoined':
                    if (data.lobbyId && window.location.pathname === `/lobby/${data.lobbyId}`) {
                        document.dispatchEvent(new CustomEvent('LobbyPlayerJoined', {
                            bubbles: true,
                            detail: { lobbyId: data.lobbyId }
                        }));
                    }
                    break;

                case 'gameStarted':
                    if (data.lobbyId) {
                        window.history.pushState({}, '', `/pong/${data.lobbyId}`);
                        document.dispatchEvent(new Event('popstate'));
                    }
                    break;

                case 'inviteReceived':
                    if (data.lobbyId && data.userId) {
                        document.dispatchEvent(new CustomEvent('LobbyInviteReceived', {
                            bubbles: true,
                            detail: { lobbyId: data.lobbyId, userId: data.userId }
                        }));
                    }
                    break;

                default:
                    break;
            }
        });
    }

    public setupEventListeners() {
        const startGameBtn = document.getElementById('startGameBtn') as HTMLElement | null;
        if (startGameBtn) {
            startGameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.messageHandler.startGame(this.lobbyId); // how do I get lobbyId??
            });
        }
    }

    public onUpdate(callback: () => void) {
        this.updateCallbacks.push(callback);
    }

    public getLobbies(): LobbyInfo[] {
        return this.lobbyData;
    }

    public getCurrentLobby(): LobbyInfo | undefined {
        return this.lobbyData.find(lobby => lobby.id === this.lobbyId);
    }
}
