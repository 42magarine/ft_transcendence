import { ServerMessage, LobbyInfo } from '../../interfaces/interfaces.js';
import MessageHandlerService from './MessageHandlerService.js';
import UserService from './UserService.js';
import { LobbyDataWithParticipants } from '../../interfaces/interfaces.js';

export const LOBBY_DETAILS_UPDATED_EVENT = 'lobbyDetailsUpdated';
export const LOBBY_PLAYER_JOINED_EVENT = 'lobbyPlayerJoined';
export const LOBBY_PLAYER_LEFT_EVENT = 'lobbyPlayerLeft';
export const LOBBY_GAME_STARTED_EVENT = 'lobbyGameStarted';
export const LOBBY_INVITE_SENT_EVENT = 'lobbyInviteSent';


export default class LobbyService {
    private lobbyData: LobbyInfo[] = [];
    private currentLobbyData?: LobbyInfo;

    private messageHandler!: MessageHandlerService;
    private userService!: UserService;

    constructor() { }

    private getCurrentLobbyIdFromUrl(): string {
        const match = window.location.pathname.match(/\/lobby\/([^/]+)/);
        return match?.[1] || '';
    }

    public init(socket: WebSocket, messageHandler: MessageHandlerService, userService: UserService): void {
        this.messageHandler = messageHandler;
        this.userService = userService;

        socket.addEventListener('message', (event: MessageEvent<string>) => {
            const data: ServerMessage = JSON.parse(event.data);
            const currentLobbyId = this.getCurrentLobbyIdFromUrl();

            let relevantToCurrentLobby = data.lobbyId === currentLobbyId;

            switch (data.type) {
                case 'lobbyList':
                    this.lobbyData = data.lobbies || [];
                    if (currentLobbyId) {
                        this.currentLobbyData = this.lobbyData.find(lobby => lobby.id === currentLobbyId);
                    } else {
                        this.currentLobbyData = undefined;
                    }
                    this.dispatchCustomEvent(LOBBY_DETAILS_UPDATED_EVENT, { lobbyData: this.currentLobbyData });
                    break;

                case 'lobbyDetailsUpdated':
                    if (data.lobby && data.lobby.id === currentLobbyId) {
                        this.currentLobbyData = data.lobby as LobbyDataWithParticipants;

                        const index = this.lobbyData.findIndex(l => l.id === data.lobby.id);
                        if (index !== -1) {
                            this.lobbyData[index] = data.lobby;
                        } else {
                            this.lobbyData.push(data.lobby);
                        }
                        this.dispatchCustomEvent(LOBBY_DETAILS_UPDATED_EVENT, { lobbyData: this.currentLobbyData });
                    }
                    break;
                case 'playerJoined':
                    if (relevantToCurrentLobby) {
                        console.log('[LobbyService] Player joined:', data);
                        this.dispatchCustomEvent(LOBBY_PLAYER_JOINED_EVENT, {
                            lobbyId: data.lobbyId,
                            userId: data.userId,
                        });
                    }
                    break;

                case 'playerLeft':
                    if (relevantToCurrentLobby) {
                        console.log('[LobbyService] Player left:', data);
                        this.dispatchCustomEvent(LOBBY_PLAYER_LEFT_EVENT, { lobbyId: data.lobbyId, userId: data.userId });
                    }
                    break;

                case 'playerReady':
                    if (relevantToCurrentLobby) {
                        console.log('[LobbyService] Player ready status changed:', data);
                    }
                    break;

                case 'gameStarted':
                    if (relevantToCurrentLobby) {
                        this.dispatchCustomEvent(LOBBY_GAME_STARTED_EVENT, { lobbyId: data.lobbyId });
                        window.history.pushState({}, '', `/pong/${data.lobbyId}`);
                        document.dispatchEvent(new Event('popstate'));
                    }
                    break;

                case 'inviteReceived':
                    if (data.lobbyId && data.userId) {
                        document.dispatchEvent(new CustomEvent('GlobalLobbyInviteReceived', {
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

    private dispatchCustomEvent(name: string, detail: any) {
        document.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
    }

    public async setupEventListeners() {

        const lobbyId = this.getCurrentLobbyIdFromUrl();
        if (!lobbyId && window.location.pathname.includes("/lobby/")) {
        }

        const startGameBtn = document.getElementById('startGameBtn') as HTMLButtonElement | null;
        if (startGameBtn) {
            startGameBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const currentLobbyId = this.getCurrentLobbyIdFromUrl();
                if (!currentLobbyId || !this.messageHandler || !this.userService) {
                    console.warn("LobbyService: Cannot handle Start Game. Dependencies missing or not on lobby page.");
                    return;
                }

                const currentUser = await UserService.getCurrentUser();
                if (!currentUser || !currentUser.id) {
                    console.warn("LobbyService: Current user not found for marking ready.");
                    return;
                }
                console.log(`[LobbyService] User ${currentUser.id} clicked ready for lobby ${currentLobbyId}`);
                this.messageHandler.markReady(currentUser.id.toString(), currentLobbyId);
            });
        }

        // Leave Lobby Button
        const leaveBtn = document.getElementById('leaveBtn') as HTMLButtonElement | null;
        if (leaveBtn) {
            leaveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const currentLobbyId = this.getCurrentLobbyIdFromUrl();
                if (currentLobbyId && this.messageHandler) {
                    console.log(`[LobbyService] Leaving lobby ${currentLobbyId}`);
                    this.messageHandler.leaveLobby(currentLobbyId);
                }
            });
        }

        document.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            if (target.matches('.invite-btn')) {
                const inviteButton = target as HTMLButtonElement;
                const userIdToInvite = inviteButton.dataset.user;
                const currentLobbyId = this.getCurrentLobbyIdFromUrl();

                if (userIdToInvite && currentLobbyId && this.messageHandler) {
                    console.log(`[LobbyService] Inviting user ${userIdToInvite} to lobby ${currentLobbyId}`);
                    this.messageHandler.sendInvite(userIdToInvite, currentLobbyId);

                    inviteButton.textContent = 'Pending...';
                    inviteButton.classList.remove('btn-primary');
                    inviteButton.classList.add('btn-warning');
                    inviteButton.disabled = true;

                    this.dispatchCustomEvent(LOBBY_INVITE_SENT_EVENT, { userId: userIdToInvite, lobbyId: currentLobbyId });
                }
            }
        });
    }

    public getLobbies(): LobbyInfo[] {
        return this.lobbyData;
    }

    public getCurrentLobby(): LobbyInfo | undefined {
        const lobbyId = this.getCurrentLobbyIdFromUrl();
        if (!lobbyId) return undefined;
        if (this.currentLobbyData && this.currentLobbyData.id === lobbyId) {
            return this.currentLobbyData;
        }
        return this.lobbyData.find(lobby => lobby.id === lobbyId);
    }

}
