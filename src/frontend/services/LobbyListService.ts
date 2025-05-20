import { ServerMessage, LobbyInfo } from '../../interfaces/interfaces.js';
import Router from '../../utils/Router.js';
import MessageHandlerService from './MessageHandlerService.js';

export default class LobbyListService {
	private lobbyData: LobbyInfo[] = [];
	private updateCallbacks: (() => void)[] = [];
	private messageHandler!: MessageHandlerService;

	public init(socket: WebSocket, messageHandler: MessageHandlerService): void {
		this.messageHandler = messageHandler;

		socket.addEventListener('message', (event: MessageEvent<string>) => {
			const data: ServerMessage = JSON.parse(event.data);

			switch (data.type) {
				case 'lobbyList':
					this.lobbyData = data.lobbies || [];
					this.updateCallbacks.forEach(cb => cb());
					break;

				case 'playerJoined':
					if (data.lobbyId && window.location.pathname === `/lobby/${data.lobbyId}`) {
						document.dispatchEvent(new CustomEvent('LobbyPlayerJoined', {
							bubbles: true,
							detail: { lobbyId: data.lobbyId }
						}));
					}
					break;

				case 'lobbyCreated':
					if (data.lobbyId) {
						this.messageHandler.requestLobbyList();
						Router.redirect(`/lobby/${data.lobbyId}`);
					}
					break;

				case 'gameStarted':
					if (data.lobbyId) {
						window.history.pushState({}, '', `/pong/${data.lobbyId}`);
						document.dispatchEvent(new Event('popstate'));
					}
					break;

				case 'inviteReceived':
					if (data.lobbyId && data.userId) {
						document.dispatchEvent(new CustomEvent('LobbyInviteReceived', {
							bubbles: true,
							detail: { lobbyId: data.lobbyId, userId: data.userId }
						}));
					}
					break;

				default:
					break;
			}
		});
	}

	public setupEventListeners() {
		const createBtn = document.getElementById('createLobbyBtn') as HTMLElement | null;
		if (createBtn) {
			createBtn.addEventListener('click', (e) => {
				e.preventDefault();
				this.messageHandler.createLobby();
			});
		}
	}

	public onUpdate(callback: () => void) {
		this.updateCallbacks.push(callback);
	}

	public getLobbies(): LobbyInfo[] {
		return this.lobbyData;
	}
}
