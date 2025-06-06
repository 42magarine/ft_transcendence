// LobbyListService.ts - Fixed version with better lobby list handling
import Router from '../../utils/Router.js';
import UserService from '../services/UserService.js';
import { IServerMessage, ILobbyState } from '../../interfaces/interfaces.js';

export default class LobbyListService {
    private lobbyData: ILobbyState[] = [];
    private lobbyDataResolvers: ((lobbies: ILobbyState[]) => void)[] = [];
    private isInitialized = false;

    constructor() {
        this.handleCreateLobbyClick = this.handleCreateLobbyClick.bind(this);
        this.handleJoinLobbyClick = this.handleJoinLobbyClick.bind(this);
    }

    public handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);

        console.log("LobbyListService received message:", data);

        switch (data.type) {
            case 'lobbyList':
                console.log("Received lobbyList update:", data.lobbies);
                this.lobbyData = data.lobbies || [];
                this.resolveLobbyDataPromises(this.lobbyData);

                // If we're on the lobby list page, update the view
                if (window.location.pathname === '/lobbylist' || window.location.pathname === '/lobbies') {
                    Router.update();
                }
                break;

            case 'lobbyCreated':
                console.log("Lobby created:", data);

                // If this user created the lobby, navigate to it
                if (window.currentUser && data.owner == window.currentUser.id && data.lobbyId) {
                    console.log("Navigating to newly created lobby:", data.lobbyId);
                    Router.redirect(`/lobby/${data.lobbyId}`);
                } else {
                    // For other users, just refresh the lobby list
                    if (window.location.pathname === '/lobbylist' || window.location.pathname === '/lobbies') {
                        this.refreshLobbyList();
                    }
                }
                break;

            case 'joinedLobby':
                console.log("Player joined lobby:", data);

                // If this user joined the lobby, navigate to it
                if (window.currentUser && data.owner == window.currentUser.id && data.lobbyId) {
                    console.log("Navigating to joined lobby:", data.lobbyId);
                    Router.redirect(`/lobby/${data.lobbyId}`);
                } else {
                    // For other users, refresh the lobby list to show updated player counts
                    if (window.location.pathname === '/lobbylist' || window.location.pathname === '/lobbies') {
                        this.refreshLobbyList();
                    }
                }
                break;

            case 'leftLobby':
                console.log("Player left lobby");

                // Always refresh the lobby list when someone leaves
                // This will update player counts and remove empty lobbies
                if (window.location.pathname === '/lobbylist' || window.location.pathname === '/lobbies') {
                    this.refreshLobbyList();
                }
                break;

            case 'playerJoined':
            case 'playerLeft':
                // These events affect lobby player counts, so refresh if on lobby list
                if (window.location.pathname === '/lobbylist' || window.location.pathname === '/lobbies') {
                    this.refreshLobbyList();
                }
                break;
        }
    }

    private async refreshLobbyList(): Promise<void> {
        try {
            if (window.messageHandler) {
                // Only request if we're not already requesting
                if (this.lobbyDataResolvers.length === 0) {
                    await window.messageHandler.requestLobbyList();
                }
            }
        } catch (error) {
            console.error("Error refreshing lobby list:", error);
        }
    }

    public setupCreateLobbyButtonListener(): void {
        const button = document.getElementById('createLobbyBtn');
        if (button) {
            button.addEventListener('click', this.handleCreateLobbyClick);
        }
    }

    public setupJoinLobbyButtonListener(): void {
        if (!window.ft_socket) {
            console.warn("LobbyListService: ft_socket not available.");
            return;
        }
        const jLButtons: NodeListOf<Element> = document.querySelectorAll('.joinLobbyBtn');
        jLButtons.forEach((jlb: Element) => {
            jlb.addEventListener('click', this.handleJoinLobbyClick);
        });
    }

    public async handleCreateLobbyClick(e: MouseEvent): Promise<void> {
        console.log("handleCreateLobbyClick");
        e.preventDefault();

        if (!window.currentUser) {
            console.warn("LobbyListService: Could not retrieve current user or user ID is missing. User might not be logged in.");
            return;
        }

        if (!window.messageHandler) {
            console.warn("LobbyListService: createLobbyBtn clicked, but messageHandler is not available.");
            return;
        }
        if (window.currentUser.id) {
            try {
                await window.messageHandler.createLobby(window.currentUser.id);
            } catch (error) {
                console.error("LobbyListService: Error calling createLobby:", error);
            }
        }
    }

    public handleJoinLobbyClick = async (e: Event) => {
        console.log("handleJoinLobbyClick");
        e.preventDefault();

        const target = e.target as HTMLElement;
        const lobbyId = target.getAttribute('data-lobby-id');

        console.log("Attempting to join lobby:", lobbyId);

        if (!lobbyId) {
            console.error("LobbyListService: joinLobbyBtn clicked, but 'data-lobby-id' attribute is missing.");
            return;
        }

        const user = await UserService.getCurrentUser();
        if (!user || !user.id) {
            console.warn("LobbyListService: Could not retrieve current user or user ID is missing. User might not be logged in.");
            return;
        }

        if (!window.messageHandler) {
            console.warn("LobbyListService: joinLobbyBtn clicked, but messageHandler is not available.");
            return;
        }

        try {
            await window.messageHandler.joinLobby(lobbyId, user.id);
        } catch (error) {
            console.error(`LobbyListService: Error calling joinLobby for lobby ${lobbyId} and user ${user.id}:`, error);
        }
    }

    private resolveLobbyDataPromises(lobbies: ILobbyState[]): void {
        this.lobbyDataResolvers.forEach(resolve => resolve(lobbies));
        this.lobbyDataResolvers = [];
    }

    public async getLobbies(): Promise<ILobbyState[]> {
        if (!window.messageHandler) {
            console.warn("LobbyListService getLobbies: messageHandler not found.");
            return Promise.resolve(this.lobbyData);
        }

        if (!window.ft_socket || window.ft_socket.readyState !== WebSocket.OPEN) {
            console.warn("LobbyListService getLobbies: WebSocket not open.");
            return Promise.resolve(this.lobbyData);
        }

        // If we already have data, return it immediately
        if (this.lobbyData.length > 0 || this.isInitialized) {
            return Promise.resolve(this.lobbyData);
        }

        // If there's already a pending request, wait for it
        if (this.lobbyDataResolvers.length > 0) {
            const promise = new Promise<ILobbyState[]>((resolve) => {
                this.lobbyDataResolvers.push(resolve);
            });
            return promise;
        }

        const promise = new Promise<ILobbyState[]>((resolve) => {
            this.lobbyDataResolvers.push(resolve);
        });

        try {
            await window.messageHandler.requestLobbyList();
            this.isInitialized = true;
        } catch (error) {
            console.error("LobbyListService getLobbies: Error during socket readiness or requesting list:", error);
            this.resolveLobbyDataPromises(this.lobbyData);
        }

        return promise;
    }
}