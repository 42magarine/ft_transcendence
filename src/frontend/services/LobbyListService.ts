// LobbyListService.ts

import Router from '../../utils/Router.js';
import UserService from '../services/UserService.js';
import { User } from '../../interfaces/userInterfaces.js';
import { ServerMessage, LobbyInfo } from '../../interfaces/interfaces.js';

export default class LobbyListService {
    private lobbyData: LobbyInfo[] = [];
    private lobbyDataResolvers: ((lobbies: LobbyInfo[]) => void)[] = [];
    private isInitialized = false;

    constructor() {
        this.handleCreateLobbyClick = this.handleCreateLobbyClick.bind(this);
        this.handleJoinLobbyClick = this.handleJoinLobbyClick.bind(this);
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
            case 'joinedLobby':
                console.log("backend->frontend joinedLobby")
                if (data.lobbyId && data.playerNumber !== undefined) {
                    Router.redirect(`/lobby/${data.lobbyId}`);
                } else {
                    console.error("LobbyListService: lobbyId or playerNumber missing for joinedLobby", data);
                }
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
        }

        this.setupCreateLobbyButtonListener();
        this.setupJoinLobbyButtonListener();
    }

    private setupCreateLobbyButtonListener(): void {
        window.socketReady?.then(() => {
            document.body.removeEventListener('click', this.handleCreateLobbyClick);
            document.body.addEventListener('click', this.handleCreateLobbyClick);
        }).catch(error => {
            console.error("LobbyListService: waiting for socketReady to setup create lobby button listener:", error);
        });
    }

    private setupJoinLobbyButtonListener(): void {
        window.socketReady?.then(() => {
            document.body.removeEventListener('click', this.handleJoinLobbyClick);
            document.body.addEventListener('click', this.handleJoinLobbyClick);
        }).catch(error => {
            console.error("LobbyListService: waiting for socketReady to setup join lobby button listener:", error);
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

    // Handles Join Lobby button click
    private async handleJoinLobbyClick(e: MouseEvent): Promise<void> {
        const target = e.target as HTMLElement;
        const button = target.closest<HTMLAnchorElement>('#joinLobbyBtn');

        if (button) {
            e.preventDefault();

            const lobbyId = button.getAttribute('data-lobby-id');
            if (!lobbyId) {
                console.error("LobbyListService: joinLobbyBtn clicked, but 'data-lobby-id' attribute is missing.");
                return;
            }

            let currentUserId: number | undefined;
            const user: User | null = await UserService.getCurrentUser();

            if (user && typeof user.id === 'number') {
                currentUserId = user.id;
            } else {
                console.warn("LobbyListService: Could not retrieve current user or user ID is missing. User might not be logged in.");
                return;
            }

            if (window.messageHandler) {
                try {
                    await window.messageHandler.joinLobby(lobbyId, currentUserId);
                } catch (error) {
                    console.error(`LobbyListService: Error calling joinLobby for lobby ${lobbyId} and user ${currentUserId}:`, error);
                }
            } else {
                console.warn("LobbyListService: joinLobbyBtn clicked, but messageHandler is not available.");
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

        try {
            await window.socketReady;
            await window.messageHandler.requestLobbyList();
        } catch (error) {
            console.error("LobbyListService getLobbies: Error during socket readiness or requesting list:", error);
            this.resolveLobbyDataPromises(this.lobbyData);
        }

        return promise;
    }

    public destroy(): void {
        if (window.ft_socket) {
            window.ft_socket.removeEventListener('message', this.handleSocketMessage);
        }
        document.body.removeEventListener('click', this.handleCreateLobbyClick);
        document.body.removeEventListener('click', this.handleJoinLobbyClick);
        this.isInitialized = false;
        console.log("LobbyListService: Destroyed listeners.");
    }
}
