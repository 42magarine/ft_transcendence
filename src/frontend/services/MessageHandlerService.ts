import { ClientMessage } from '../../interfaces/interfaces.js';
import UserService from './UserService.js';

export default class MessageHandlerService {
    private socket: WebSocket;
    private socketReady: Promise<void>;
    private userService: UserService;
    private currentUser: any = null;

    constructor(socket: WebSocket, socketReady: Promise<void>, userService: UserService) {
        this.socket = socket;
        this.socketReady = socketReady;
        this.userService = userService;
    }

    private async safeSend(msg: ClientMessage) {
        console.log('[safeSend] Socket state:', this.socket?.readyState);
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(msg));
        } else {
            console.warn('Tried to send message but socket not open:', msg);
        }
    }

    public async createLobby() {
        this.currentUser = await UserService.getCurrentUser();
        await this.socketReady;
        if (!this.currentUser) return;

        const msg: ClientMessage = {
            type: 'createLobby',
            userId: this.currentUser.id,
        };
        this.safeSend(msg);
    }

    public async joinGame(lobbyId: string, userId: number) {
        await this.socketReady;
        const msg: ClientMessage = {
            type: 'joinLobby',
            lobbyId,
            userId
        };
        this.safeSend(msg);
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

    public requestLobbyList() {
        const msg: ClientMessage = {
            type: 'getLobbyList',
        };
        this.safeSend(msg);
    }
}
