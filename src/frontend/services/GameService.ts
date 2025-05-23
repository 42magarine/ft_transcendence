import UserService from './UserService.js';
import MessageHandlerService from './MessageHandlerService.js';
import LobbyListService from './LobbyListService.js';
import LobbyService from './LobbyService.js';
import { ServerMessage } from '../../interfaces/interfaces.js';

class GameService {
	private socket!: WebSocket;
	private socketReady: Promise<void> = Promise.resolve();
	private userService: UserService;
	private messageHandler!: MessageHandlerService;
	private lobbyListService = new LobbyListService();
	private lobbyService = new LobbyService();

	constructor() {
		this.userService = new UserService();
	}

	public initSocket() {
		this.socket = new WebSocket("wss://localhost:3000/game/wss");

		this.socketReady = this.webSocketWrapper(this.socket)
			.then(() => {
				console.log('Connected to WebSocket server');
				this.messageHandler = new MessageHandlerService(this.socket, this.socketReady, this.userService);

				this.lobbyListService.init(this.socket, this.messageHandler);
				// Pass userService to LobbyService's init method
				this.lobbyService.init(this.socket, this.messageHandler, this.userService);
			})
			.catch((err) => {
				console.error('WebSocket connection error:', err);
				throw err;
			});
	}

	private webSocketWrapper(socket: WebSocket): Promise<void> {
		return new Promise((resolve, reject) => {
			if (socket.readyState === WebSocket.OPEN) {
				resolve();
			} else {
				socket.addEventListener('open', () => resolve(), { once: true });
				socket.addEventListener('error', (event) => {
                    console.error('WebSocket error event:', event);
					reject(new Error('WebSocket connection failed'));
                }, { once: true });
			}
		});
	}

	public initialize(): void {
		document.addEventListener('RouterContentLoaded', () => {
			this.initSocket();

			this.socketReady.then(() => {
				this.lobbyListService.setupEventListeners();
				this.lobbyService.setupEventListeners();
			}).catch(err => {
				console.error("Failed to setup service event listeners due to WebSocket readiness issue:", err);
			});
		});
	}

	public get message() {
		return this.messageHandler;
	}

	public get lobbyList() {
		return this.lobbyListService;
	}

	public get lobby() {
		return this.lobbyService;
	}

	public get user() {
		return this.userService;
	}
}

const gameService = new GameService();
gameService.initialize();
export default gameService;
