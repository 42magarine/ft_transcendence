import { ServerMessage, LobbyInfo } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';
import MessageHandlerService from './MessageHandlerService.js';
import UserService from './UserService.js';

export default class LobbyListService {
    private lobbyData: LobbyInfo[] = [];

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
                    break;
                case 'lobbyCreated':
                    console.log("lobbyCreated")
                    console.log(data.lobbyId)
                    if (data.lobbyId && window.messageHandler) {
                        //window.messageHandler.requestLobbyList();
                        // UserService.getCurrentUser().then((user) => {
                        //     if (typeof user?.id === 'number' && window.messageHandler) {
                        //         window.messageHandler.joinGame(data.lobbyId!, user.id);
                        //     } else {
                        //         console.error('Could not fetch user ID to join lobby');
                        //     }
                        // });

                        Router.redirect(`/lobby/${data.lobbyId}`);
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
                createBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.messageHandler) {
                        window.messageHandler.createLobby();
                    }
                });
            }
        });
    }

    public getLobbies(): LobbyInfo[] {
        return this.lobbyData;
    }
}
