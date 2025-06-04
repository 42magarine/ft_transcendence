import { IClientMessage } from '../../interfaces/interfaces.js';

export default class MessageHandlerService {
    private readyState: Map<number, boolean> = new Map();

    private async safeSend(msg: IClientMessage) {
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
        // console.log("safeSend (frontend->backend): ", msg)
        window.ft_socket.send(JSON.stringify(msg));
    }

    public async createLobby(userId: number) {
        const msg: IClientMessage = {
            type: 'createLobby',
            userId
        };
        await this.safeSend(msg);
    }

    public async joinLobby(lobbyId: string, userId: number) {
        const msg: IClientMessage = {
            type: 'joinLobby',
            lobbyId,
            userId
        };
        await this.safeSend(msg);
    }

    public async startGame(lobbyId: string) {
        const msg: IClientMessage = {
            type: 'startGame',
            lobbyId,
        };
        await this.safeSend(msg);
    }

    public async markReady(lobbyId: string, userId: number) {
        const current = this.readyState.get(userId) ?? false;
        const next = !current;
        this.readyState.set(userId, next);

        const msg: IClientMessage = {
            type: 'ready',
            userId,
            lobbyId,
            ready: next,
        };

        await this.safeSend(msg);
    }

    public async leaveLobby(lobbyId: string) {
        const msg: IClientMessage = {
            type: 'leaveLobby',
            lobbyId
        };
        await this.safeSend(msg);
    }

    public async requestLobbyList() {
        const msg: IClientMessage = {
            type: 'getLobbyList',
        };
        await this.safeSend(msg);
    }

    public async requestLobbyState(lobbyId: string) {
        const msg: IClientMessage = {
            type: 'getLobbyState',
            lobbyId
        };
        await this.safeSend(msg);
    }
}
