import { IServerMessage, ILobbyState } from '../../interfaces/interfaces.js';
import MessageHandlerService from './MessageHandlerService.js';
import UserService from './UserService.js';

export default class LobbyService {
    private lobbyState!: ILobbyState;
    private socket?: WebSocket;

    private messageHandler: MessageHandlerService;
    private userService: UserService; // Now required in constructor

    private lobbyDataResolvers: ((lobby: ILobbyState) => void)[] = [];

    constructor(messageHandler: MessageHandlerService, userService: UserService) {
        this.messageHandler = messageHandler;
        this.userService = userService;

        this.handleSocketMessage = this.handleSocketMessage.bind(this);
        this.handleLobbyPageClick = this.handleLobbyPageClick.bind(this);

        this.setupUIEventListeners();

        console.log('[LobbyService] Core dependencies initialized.');
    }

    public connectSocket(socket: WebSocket): void {
        if (this.socket === socket && this.socket.readyState === WebSocket.OPEN) {
            return;
        }

        if (this.socket) {
            this.socket.removeEventListener('message', this.handleSocketMessage);
        }

        this.socket = socket;
        this.socket.addEventListener('message', this.handleSocketMessage);
    }

    /**
     * Disconnects the current WebSocket from the service.
     */
    public disconnectSocket(): void {
        if (this.socket) {
            this.socket.removeEventListener('message', this.handleSocketMessage);
            this.socket = undefined;
            console.log('[LobbyService] Socket disconnected.');
        }
    }

    private getCurrentLobbyIdFromUrl(): string {
        const match = window.location.pathname.match(/\/lobby\/([^/]+)/);
        return match?.[1] || '';
    }

    private handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);
        const currentUrlLobbyId = this.getCurrentLobbyIdFromUrl();
        console.log(data.type)
        switch (data.type) {
            case 'lobbyState':
                if (data.lobby) {
                    const receivedLobbyInfo: ILobbyState = {
                        ...data.lobby,
                        createdAt: new Date(data.lobby.createdAt),
                        lobbyPlayers: data.lobby.lobbyPlayers || []
                    };

                    // Update general cache if it's the current lobby
                    if (receivedLobbyInfo.lobbyId === currentUrlLobbyId) {
                        this.lobbyState = receivedLobbyInfo;
                        // console.log(`[LobbyService] Main lobbyState for ${currentUrlLobbyId} updated.`);
                    }
                }
                break;
            // ... other cases
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
            // messageHandler and userService are now guaranteed to be available
            if (!currentLobbyId) { // Still check currentLobbyId
                console.warn("[LobbyService] Cannot start game: current lobby ID not found.");
                return;
            }
            const currentUser = await UserService.getCurrentUser(); // Assuming this is a static method
            if (!currentUser || !currentUser.id) {
                console.warn("[LobbyService] Cannot start game: current user not found.");
                return;
            }
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

    private resolveLobbyDataPromises(lobbies: ILobbyState): void {
        this.lobbyDataResolvers.forEach(resolve => resolve(lobbies));
        this.lobbyDataResolvers = [];
    }

    public async getLobbyState(): Promise<ILobbyState> {
        if (!window.messageHandler) {
            console.warn("LobbyListService getLobbies: messageHandler not found.");
            return Promise.resolve(this.lobbyState);
        }
        if (!window.ft_socket || window.ft_socket.readyState !== WebSocket.OPEN) {
            console.warn("LobbyListService getLobbies: WebSocket not open.");
            return Promise.resolve(this.lobbyState);
        }

        const promise = new Promise<ILobbyState>((resolve) => {
            this.lobbyDataResolvers.push(resolve);
        });

        try {
            await window.socketReady;
            await window.messageHandler.requestLobbyList();
        } catch (error) {
            console.error("LobbyListService getLobbies: Error during socket readiness or requesting list:", error);
            this.resolveLobbyDataPromises(this.lobbyState);
        }

        return promise;
    }


    public destroy(): void {
        this.disconnectSocket(); // Use the dedicated disconnect method
        document.body.removeEventListener('click', this.handleLobbyPageClick);

        // No need to nullify messageHandler and userService, as they are constructor-injected
        // and their lifecycle is managed by whatever created LobbyService.

        console.log('[LobbyService] Destroyed.');
    }
}
// // ... other cases remain the same
// case 'playerReady':
//     if (currentUrlLobbyId && data.lobbyId === currentUrlLobbyId && data.userId !== undefined && typeof data.isReady === 'boolean') {
//         if (this.lobbyState && this.lobbyState.lobbyPlayers && this.lobbyState.lobbyId === currentUrlLobbyId) {
//             const player = this.lobbyState.lobbyPlayers.find(p => p.userId === data.userId);
//             if (player) {
//                 player.isReady = data.isReady;
//                 // console.log(`[LobbyService] Player ${data.userId} ready status updated to ${data.isReady}. Players:`, this.lobbyState.lobbyPlayers);
//             } else {
//                 console.warn(`[LobbyService] playerReady: Player with userId ${data.userId} not found in lobbyPlayers.`);
//             }
//         } else {
//              console.warn("[LobbyService] playerReady: lobbyState not available or for a different lobby.");
//         }
//     }
//     break;
// case 'allPlayersReady':
//     if (currentUrlLobbyId && data.lobbyId === currentUrlLobbyId) {
//         console.log("[LobbyService] All players are ready!");
//     }
//     break;
// case 'playerJoined':
//     if (currentUrlLobbyId && data.lobbyId === currentUrlLobbyId) {
//         const { playerNumber, userId, userName, isReady } = data;
//         if (typeof playerNumber === 'number' && typeof userId === 'number' && typeof userName === 'string' && typeof isReady === 'boolean') {
//             const joinedPlayer: IPlayerState = { playerNumber, userId, userName, isReady };
//             if (this.lobbyState && this.lobbyState.lobbyId === currentUrlLobbyId) {
//                 if (!this.lobbyState.lobbyPlayers) this.lobbyState.lobbyPlayers = [];
//                 this.lobbyState.lobbyPlayers = this.lobbyState.lobbyPlayers.filter(
//                     p => p.userId !== joinedPlayer.userId && p.playerNumber !== joinedPlayer.playerNumber
//                 );
//                 this.lobbyState.lobbyPlayers.push(joinedPlayer);
//                 this.lobbyState.lobbyPlayers.sort((a, b) => a.playerNumber - b.playerNumber);
//                 // console.log("[LobbyService] Player joined, lobbyPlayers updated:", this.lobbyState.lobbyPlayers);
//             } else {
//                 console.warn("[LobbyService] playerJoined: lobbyState not available or for a different lobby.");
//             }
//         } else {
//             console.warn("[LobbyService] Received incomplete playerJoined data:", data);
//         }
//     }
//     break;
// case 'playerLeft':
//     if (currentUrlLobbyId && data.lobbyId === currentUrlLobbyId && data.playerInfo) {
//         const playerNumberToRemove = data.playerInfo.playerNumber;
//         if (typeof playerNumberToRemove === 'number') {
//             if (this.lobbyState && this.lobbyState.lobbyPlayers && this.lobbyState.lobbyId === currentUrlLobbyId) {
//                 const initialPlayerCount = this.lobbyState.lobbyPlayers.length;
//                 this.lobbyState.lobbyPlayers = this.lobbyState.lobbyPlayers.filter(p => p.playerNumber !== playerNumberToRemove);
//                 if (this.lobbyState.lobbyPlayers.length < initialPlayerCount) {
//                     // console.log(`[LobbyService] Player from slot ${playerNumberToRemove} left, lobbyPlayers updated:`, this.lobbyState.lobbyPlayers);
//                 } else {
//                     console.warn(`[LobbyService] PlayerLeft: Player in slot ${playerNumberToRemove} not found.`);
//                 }
//             } else {
//                  console.warn("[LobbyService] playerLeft: lobbyState not available or for a different lobby.");
//             }
//         } else {
//              console.warn("[LobbyService] PlayerLeft: playerNumber missing or invalid in playerInfo.", data.playerInfo);
//         }
//     }
//     break;
// case 'gameStarted':
//     if (currentUrlLobbyId && data.lobbyId === currentUrlLobbyId) {
//         console.log(`[LobbyService] Game started in lobby ${data.lobbyId}. Game ID: ${data.gameId}`);
//         if (this.lobbyState && this.lobbyState.lobbyId === currentUrlLobbyId) {
//             this.lobbyState.isStarted = true;
//         }
//     }
//     break;
