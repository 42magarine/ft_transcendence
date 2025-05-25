import { ClientMessage, LobbyInfo } from '../../interfaces/interfaces.js';
import UserService from './UserService.js';

export default class MessageHandlerService {
    private currentUser: any = null;
    private pendingRequests: Map<string, { resolve: Function, reject: Function, timeout: NodeJS.Timeout }> = new Map();

    constructor() {
    }

    private async safeSend(msg: ClientMessage) {
        try {
            if (window.socketReady) {
                await window.socketReady;
            }

            if (window.ft_socket) {
                if (window.ft_socket.readyState === WebSocket.OPEN) {
                    window.ft_socket.send(JSON.stringify(msg));
                }
            }
        } catch (error) {
            console.error('Error sending message:', error, msg);
        }
    }

    public async createLobby() {
        this.currentUser = await UserService.getCurrentUser();
        if (!this.currentUser) return;

        const msg: ClientMessage = {
            type: 'createLobby',
            userId: this.currentUser.id,
        };
        await this.safeSend(msg);
    }

    public async joinGame(lobbyId: string, userId: number) {
        const msg: ClientMessage = {
            type: 'joinLobby',
            lobbyId,
            userId
        };
        await this.safeSend(msg);
    }

    public async startGame(lobbyId: string) {
        const msg: ClientMessage = {
            type: 'startGame',
            lobbyId,
        };
        await this.safeSend(msg);
    }

    public async markReady(userID: string, lobbyId: string) {
        const msg: ClientMessage = {
            type: 'playerReady',
            userID,
            lobbyId,
        };
        await this.safeSend(msg);
    }

    public async leaveLobby(lobbyId: string) {
        const msg: ClientMessage = {
            type: 'leaveLobby',
            lobbyId,
        };
        await this.safeSend(msg);
    }

    public async sendInvite(userID: string, lobbyId: string) {
        const msg: ClientMessage = {
            type: 'sendInvite',
            userID,
            lobbyId,
        };
        await this.safeSend(msg);
    }

    public async acceptInvite(userID: string, lobbyId: string) {
        const msg: ClientMessage = {
            type: 'acceptInvite',
            userID,
            lobbyId,
        };
        await this.safeSend(msg);
    }

    public async requestLobbyList(): Promise<LobbyInfo[]> {
        const msg: ClientMessage = {
            type: 'getLobbyList',
        };

        return new Promise<LobbyInfo[]>((resolve, reject) => {
            const requestId = 'lobbyList';
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error('Lobby list request timed out'));
            }, 5000);

            this.pendingRequests.set(requestId, { resolve, reject, timeout });

            this.safeSend(msg).catch(reject);
        });
    }
}