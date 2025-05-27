// LobbyListService.ts

import { ServerMessage, LobbyInfo } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';

export default class LobbyListService {
    private lobbyData: LobbyInfo[] = [];
    private lobbyDataResolvers: ((lobbies: LobbyInfo[]) => void)[] = [];
    private isInitialized = false;

    constructor() {
        this.handleCreateLobbyClick = this.handleCreateLobbyClick.bind(this);
        this.handleSocketMessage = this.handleSocketMessage.bind(this);
    }

    private handleSocketMessage(event: MessageEvent<string>): void {
        const data: ServerMessage = JSON.parse(event.data);

        switch (data.type) {
            case 'lobbyList':
                this.lobbyData = data.lobbies || [];
                this.resolveLobbyDataPromises(this.lobbyData);
                break;
            case 'lobbyCreated':
                if (data.lobbyId && window.messageHandler) {
                    window.messageHandler.requestLobbyList();
                    Router.redirect(`/lobby/${data.lobbyId}`);
                } else {
                    console.error("LobbyListService: lobbyId or messageHandler missing for lobbyCreated", data, window.messageHandler);
                }
                break;
            default:
                break;
        }
    }

    public init(): void {
        if (!window.ft_socket) {
            console.warn("LobbyListService init: ft_socket not available.");
            return;
        }

        if (!this.isInitialized) {
            window.ft_socket.addEventListener('message', this.handleSocketMessage);
            this.isInitialized = true;
            console.log("LobbyListService: WebSocket message listener initialized.");
        }

        this.setupCreateLobbyButtonListener();
    }

    private setupCreateLobbyButtonListener(): void {
        window.socketReady?.then(() => {
            document.body.removeEventListener('click', this.handleCreateLobbyClick);
            document.body.addEventListener('click', this.handleCreateLobbyClick);
        }).catch(error => {
            console.error("LobbyListService: waiting for socketReady to setup button listener:", error);
        });
    }

    private async handleCreateLobbyClick(e: MouseEvent): Promise<void> {
        const target = e.target as HTMLElement;
        const button = target.closest('#createLobbyBtn');

        if (button) {
            e.preventDefault();
            if (window.messageHandler) {
                try {
                    await window.messageHandler.createLobby();
                } catch (error) {
                    console.error("LobbyListService: Error calling createLobby:", error);
                }
            } else {
                console.warn("LobbyListService: createLobbyBtn clicked, but messageHandler is not available.");
            }
        }
    }

    private resolveLobbyDataPromises(lobbies: LobbyInfo[]): void {
        this.lobbyDataResolvers.forEach(resolve => resolve(lobbies));
        this.lobbyDataResolvers = [];
    }

    public async getLobbies(): Promise<LobbyInfo[]> {
        if (!window.messageHandler) {
            console.warn("LobbyListService getLobbies: messageHandler not found.");
            return Promise.resolve(this.lobbyData);
        }
        if (!window.ft_socket || window.ft_socket.readyState !== WebSocket.OPEN) {
            console.warn("LobbyListService getLobbies: WebSocket not open.");
            return Promise.resolve(this.lobbyData);
        }

        const promise = new Promise<LobbyInfo[]>((resolve) => {
            this.lobbyDataResolvers.push(resolve);
        });

        await window.socketReady;
        await window.messageHandler.requestLobbyList();

        return promise;
    }

    public destroy(): void {
        if (window.ft_socket) {
            window.ft_socket.removeEventListener('message', this.handleSocketMessage);
        }
        document.body.removeEventListener('click', this.handleCreateLobbyClick);
        this.isInitialized = false;
        console.log("LobbyListService: Destroyed listeners.");
    }
}
