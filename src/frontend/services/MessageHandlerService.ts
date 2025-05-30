import { ClientMessage } from '../../interfaces/interfaces.js';
import UserService from './UserService.js';

export default class MessageHandlerService {
    private currentUser: any = null;

    constructor() {
    }

    private async safeSend(msg: ClientMessage) {
        console.log("safeSend -> ", msg)
        if (!window.socketReady) {
            console.error('MessageHandlerService: window.socketReady promise does not exist.');
            throw new Error('Socket readiness promise not available. Cannot send message.');
        }

        await window.socketReady;

        if (!window.ft_socket) {
            console.error('MessageHandlerService: window.ft_socket is undefined.');
            throw new Error('WebSocket instance not available. Cannot send message.');
        }

        if (window.ft_socket.readyState !== WebSocket.OPEN) {
            const errorMessage = `WebSocket is not open. Current state: ${window.ft_socket.readyState}. Message not sent.`;
            console.warn(`MessageHandlerService: ${errorMessage}`, msg);
            throw new Error(errorMessage);
        }

        window.ft_socket.send(JSON.stringify(msg));
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

    public async joinLobby(lobbyId: string, userId: number) {
        console.log("JOINNNN")
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
            type: 'ready',
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

    public async requestLobbyList() {
        const msg: ClientMessage = {
            type: 'getLobbyList',
        };
        await this.safeSend(msg);
    }

    public async requestLobbyById(lobbyId: string) {
        const msg: ClientMessage = {
            type: 'getLobbyById',
            lobbyId
        };
    }
}
