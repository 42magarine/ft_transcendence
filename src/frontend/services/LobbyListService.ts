import Router from '../../utils/Router.js';
import UserService from '../services/UserService.js';
import { IServerMessage, ILobbyState } from '../../interfaces/interfaces.js';

export default class LobbyListService {
    private lobbyData: ILobbyState[] = [];
    private lobbyDataResolvers: ((lobbies: ILobbyState[]) => void)[] = [];

    public handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);

        switch (data.type) {
            case 'lobbyList':
                this.lobbyData = data.lobbies || [];
                this.resolveLobbyDataPromises(this.lobbyData);
                break;
            case 'lobbyCreated':
                console.log(window.currentUser)
                console.log(data.owner)
                if (window.currentUser && data.owner != window.currentUser.id && (window.location.pathname === '/lobbylist' || window.location.pathname === '/lobbies' || window.location.pathname.includes("/lobby/"))) {
                    Router.update()
                }
                if (window.currentUser && data.owner == window.currentUser.id && data.lobbyId && window.messageHandler) {
                    window.messageHandler.requestLobbyList();
                    Router.redirect(`/lobby/${data.lobbyId}`);
                }
                break;
            case 'joinedLobby':
                console.log(window.currentUser)
                console.log(data.owner)
                if (window.currentUser && data.owner != window.currentUser.id && (window.location.pathname === '/lobbylist' || window.location.pathname === '/lobbies' || window.location.pathname.includes("/lobby/"))) {
                    window.messageHandler!.requestLobbyList();
                    Router.update()
                }
                if (window.currentUser && data.owner == window.currentUser.id && data.lobbyId && window.messageHandler) {
                    window.messageHandler.requestLobbyList();
                    Router.redirect(`/lobby/${data.lobbyId}`);
                }
                break;
            case 'leftLobby':
                if (window.location.pathname === '/lobbylist' || window.location.pathname === '/lobbies' || window.location.pathname.includes("/lobby/")) {
                    Router.update()
                }
                break;
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
            console.warn("TournamentListService: ft_socket not available.");
            return;
        }
        const jLButton: NodeListOf<Element> = document.querySelectorAll('.joinLobbyBtn');
        jLButton.forEach((jlb: Element) => {
            jlb.addEventListener('click', this.handleJoinLobbyClick);
        });
    }

    public async handleCreateLobbyClick(e: MouseEvent): Promise<void> {
        e.preventDefault();

        if (!window.currentUser) {
            console.warn("LobbyListService: Could not retrieve current user or user ID is missing. User might not be logged in.");
            return;
        }
        if (window.currentUser) {
            if (window.messageHandler && window.currentUser.id) {
                try {
                    await window.messageHandler.createLobby(window.currentUser.id);
                }
                catch (error) {
                    console.error("LobbyListService: Error calling createLobby:", error);
                }
            }
        }

        else {
            console.warn("LobbyListService: createLobbyBtn clicked, but messageHandler is not available.");
        }
    }

    public handleJoinLobbyClick = async (e: Event) => {
        e.preventDefault();

        const target = e.target as HTMLElement;
        const lobbyId = target.getAttribute('data-lobby-id');
        if (!lobbyId) {
            console.error("LobbyListService: joinLobbyBtn clicked, but 'data-lobby-id' attribute is missing.");
            return;
        }

        const user = await UserService.getCurrentUser();
        if (!user) {
            console.warn("LobbyListService: Could not retrieve current user or user ID is missing. User might not be logged in.");
            return;
        }

        if (window.messageHandler) {
            try {
                await window.messageHandler.joinLobby(lobbyId, user.id!);
            }
            catch (error) {
                console.error(`LobbyListService: Error calling joinLobby for lobby ${lobbyId} and user ${user.id}:`, error);
            }
        }
        else {
            console.warn("LobbyListService: joinLobbyBtn clicked, but messageHandler is not available.");
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

        const promise = new Promise<ILobbyState[]>((resolve) => {
            this.lobbyDataResolvers.push(resolve);
        });

        try {
            await window.messageHandler.requestLobbyList();
        }
        catch (error) {
            console.error("LobbyListService getLobbies: Error during socket readiness or requesting list:", error);
            this.resolveLobbyDataPromises(this.lobbyData);
        }

        return promise;
    }
}
