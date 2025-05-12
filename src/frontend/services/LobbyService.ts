import UserService from './UserService.js';
import { ClientMessage, ServerMessage } from '../../types/interfaces.js';

export default class LobbyService {
	private socket: any;
	private userService: UserService;
	private lobbyId: string | null = null;
	private currentUser: any = null;
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private players: Map<number, any> = new Map();
	private playerIds: number[] = [];

	constructor() {
		this.userService = new UserService();
		this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
		this.ctx = this.canvas.getContext('2d')!;
		this.initSocket();
		this.setupEventListeners();
		this.renderPlayerNames();

		window.addEventListener('beforeunload', () => {
			const msg: ClientMessage = { type: 'resetGame' };
			this.safeSend(msg);
		});

		window.addEventListener('unload', () => {
			const msg: ClientMessage = { type: 'resetGame' };
			this.safeSend(msg);
		});
	}

	private initSocket() {
		this.socket = new WebSocket('wss://localhost:3000/game/wss');

		this.socket.addEventListener('open', () => {
			console.log('Connected to WebSocket server');
			this.createOrJoinLobby();
		});

		this.socket.addEventListener('message', (event: MessageEvent<string>) => {
			const data: ServerMessage = JSON.parse(event.data);

			if (data.type === 'assignPlayer') {
				this.lobbyId = data.lobbyId!;
				this.currentUser = data.user!;
				this.players.set(data.id, data.user!);
				this.renderPlayerNames();
			}

			if (data.type === 'lobbyInfo') {
				this.updatePlayerList(data.players!);
			}

			if (data.type === 'playerJoined') {
				this.addPlayer(data.playerInfo!);
			}

			if (data.type === 'playerDisconnected') {
				this.removePlayer(data.id!);
			}
		});
	}

	private async createOrJoinLobby() {
		this.currentUser = await this.userService.getCurrentUser();

		const urlParams = new URLSearchParams(window.location.search);
		const existingLobbyId = urlParams.get('lobbyId');

		const msg: ClientMessage = existingLobbyId
			? {
					type: 'joinLobby',
					userId: this.currentUser.id,
					lobbyId: existingLobbyId,
			  }
			: {
					type: 'createLobby',
					userId: this.currentUser.id,
			  };

		this.safeSend(msg);
	}

	private safeSend(msg: ClientMessage) {
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(msg));
		} else {
			console.warn('Tried to send message but socket not open:', msg);
		}
	}

	private setupEventListeners() {
		const startGameButton = document.getElementById('startGameButton');
		if (startGameButton) {
			startGameButton.addEventListener('click', () => this.startGame());
		}
	}

	private async startGame() {
		if (this.lobbyId) {
			const startMsg: ClientMessage = {
				type: 'startGame',
				lobbyId: this.lobbyId,
			};
			this.safeSend(startMsg);
		}
	}

	private updatePlayerList(players: any[]) {
		const playerListContainer = this.createPlayerListContainer();

		this.playerIds = []; // Reset player order
		players.forEach(async (player) => {
			const playerInfo = await this.userService.getUserById(player.userId);
			this.players.set(player.id, playerInfo);

			if (!this.playerIds.includes(player.id)) {
				this.playerIds.push(player.id);
			}

			const playerItem = this.createPlayerListItem(playerInfo, player);
			playerListContainer.appendChild(playerItem);
		});

		const leftSidebar = document.createElement('div');
		leftSidebar.className =
			'fixed left-0 top-1/2 transform -translate-y-1/2 bg-gray-100 p-4 rounded-r-lg shadow-lg';
		leftSidebar.appendChild(playerListContainer);
		document.body.appendChild(leftSidebar);

		this.renderPlayerNames();
	}

	private createPlayerListContainer(): HTMLUListElement {
		const container = document.createElement('ul');
		container.className = 'space-y-2';
		return container;
	}

	private createPlayerListItem(userInfo: any, playerStatus: any): HTMLLIElement {
		const listItem = document.createElement('li');
		listItem.className =
			'flex items-center justify-between bg-white p-2 rounded-lg shadow';

		const userInfoDiv = document.createElement('div');
		userInfoDiv.innerHTML = `
        <span class="font-bold">${userInfo.username}</span>
        <span class="text-sm text-gray-500 ml-2">${playerStatus.isReady ? 'Ready' : 'Not Ready'}</span>
    `;

		const inviteButton = document.createElement('button');
		inviteButton.textContent = 'Invite';
		inviteButton.className =
			'bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600';
		inviteButton.addEventListener('click', () =>
			this.inviteUser(userInfo.id),
		);

		listItem.appendChild(userInfoDiv);
		listItem.appendChild(inviteButton);

		return listItem;
	}

	private inviteUser(userId: number) {
		if (this.currentUser && this.lobbyId) {
			const inviteMsg: ClientMessage = {
				type: 'invite',
				userId: this.currentUser.id,
				targetUserId: userId,
			};
			this.safeSend(inviteMsg);
		}
	}

	private addPlayer(playerInfo: any) {
		this.players.set(playerInfo.id, playerInfo);
		if (!this.playerIds.includes(playerInfo.id)) {
			this.playerIds.push(playerInfo.id);
		}
		this.renderPlayerNames();
	}

	private removePlayer(playerId: number) {
		this.players.delete(playerId);
		this.renderPlayerNames();
	}

	private renderPlayerNames() {
		if (!this.ctx) return;

		this.ctx.clearRect(0, this.canvas.height - 50, this.canvas.width, 50);
		this.ctx.font = '20px Arial';
		this.ctx.fillStyle = 'white';

		if (this.playerIds.length >= 1) {
			const player1 = this.players.get(this.playerIds[0]);
			if (player1) {
				this.ctx.textAlign = 'left';
				this.ctx.fillText(player1.username || 'Player 1', 10, this.canvas.height - 10);
			}
		}

		if (this.playerIds.length >= 2) {
			const player2 = this.players.get(this.playerIds[1]);
			if (player2) {
				this.ctx.textAlign = 'right';
				this.ctx.fillText(player2.username || 'Player 2', this.canvas.width - 10, this.canvas.height - 10);
			}
		}
	}
}

// Auto-initialize
new LobbyService();
