import { ServerMessage, LobbyInfo } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';

export default class LobbyListService {
    private lobbyData: LobbyInfo[] = [];
    private lobbyDataResolvers: ((lobbies: LobbyInfo[]) => void)[] = [];
    constructor() {
    }

    public init(): void {
        if (!window.ft_socket) {
            return;
        }
        window.ft_socket.addEventListener('message', (event: MessageEvent<string>) => {
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
                // case 'playerJoined':
                // 	break;
                // case 'gameStarted':
                // 	break;
                // case 'inviteReceived':
                // 	break;
                default:
                    break;
            }
        });

        window.socketReady?.then(() => {
            const createBtn = document.getElementById('createLobbyBtn') as HTMLElement | null;
            if (createBtn) {
                createBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    if (window.messageHandler) {
                        await window.messageHandler.createLobby();
                    }
                });
            }
        })
    }

    private resolveLobbyDataPromises(lobbies: LobbyInfo[]): void {
        this.lobbyDataResolvers.forEach(resolve => resolve(lobbies));
        this.lobbyDataResolvers = [];
    }

    public async fetchAndGetLobbies(): Promise<LobbyInfo[]> {
        if (!window.messageHandler) {
            return Promise.resolve(this.lobbyData);
        }
        if (!window.ft_socket || window.ft_socket.readyState !== WebSocket.OPEN) {
            return Promise.resolve(this.lobbyData);
        }

        const promise = new Promise<LobbyInfo[]>((resolve) => {
            this.lobbyDataResolvers.push(resolve);
        });

        await window.messageHandler.requestLobbyList();

        return promise;
    }

    // public getLobbies(): LobbyInfo[] {
    //     return this.lobbyData;
    // }
}
