import AbstractView from '../../utils/AbstractView.js';
import Title from '../components/Title.js';
import Button from '../components/Button.js';
import Card from '../components/Card.js';
import lobbyService from '../services/LobbyService.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import Router from '../../utils/Router.js';

interface UserList {
	listAvatar: string;
	id?: number;
	username: string;
	email: string;
	displayname?: string;
	role?: string;
}

type PlayerStatus = 'ready' | 'waiting' | 'unavailable';

export default class Lobby extends AbstractView {
	private lobbyId: string;
	private User1 = { username: 'You', status: 'waiting' as PlayerStatus };
	private User2 = { username: 'Bob', status: 'unavailable' as PlayerStatus };

	constructor(params: URLSearchParams) {
		super();
		this.lobbyId = params.get('id') || '';
	}

	async getHtml(): Promise<string> {
		const title = new Title({ title: `Lobby #${this.lobbyId}` });

		const debugSimulateButton = `
			<div class="text-right mt-4">
				<button id="simulatePlayer2Ready" class="btn btn-secondary btn-sm">Simulate Player 2 accept invite</button>
			</div>
		`;

		const titleSection = await title.getHtml();

		const button = new Button();
		const player1Btn = await button.renderButton({
			id: 'player1',
			text: this.User1.username,
			status: this.User1.status,
		});
		const player2Btn = await button.renderButton({
			id: 'player2',
			text: this.User2.username,
			status: this.User2.status,
		});

		let startStatus: 'unavailable' | 'waiting' | 'ready' = 'unavailable';
		if (this.User1.status === 'ready' && this.User2.status === 'ready') {
			startStatus = 'ready';
		} else if (this.User1.status === 'waiting' || this.User2.status === 'waiting') {
			startStatus = 'waiting';
		}

		const startButtonStatusClassMap = {
			unavailable: 'btn-danger',
			waiting: 'btn-warning',
			ready: 'btn-success',
		};

		const startButtonTextMap = {
			unavailable: 'Invite Players to start game',
			waiting: 'Wait for Invite acception',
			ready: 'Start Game',
		};

		const startGameButton = {
			id: 'startGameBtn',
			text: startButtonTextMap[startStatus],
			className: `${startButtonStatusClassMap[startStatus]} ${startStatus !== 'ready' ? 'cursor-not-allowed opacity-60' : ''}`,
			type: 'button' as const
		};

		const isPlayer2Unavailable = this.User2.status === 'unavailable';
		const readyButtonConfig = {
			id: 'readyBtn',
			text: this.User1.status === 'ready' ? 'Unready' : 'Ready',
			className: `btn btn-primary ${isPlayer2Unavailable ? 'cursor-not-allowed opacity-60' : ''}`,
			type: 'button' as const
		};

		const actionButtonsGroup = await button.renderGroup({
			layout: 'group',
			align: 'center',
			buttons: [
				startGameButton,
				readyButtonConfig,
				{
					id: 'leaveBtn',
					text: 'Leave Lobby',
					className: 'btn btn-danger',
					type: 'button',
					href: '/lobbylist'
				}
			]
		});

		// 👥 Fetch Invite List (only if player 2 hasn't joined yet)
		let users: UserList[] = [];
		let inviteListCard = '';
		if (this.User2.status === 'unavailable') {
			try {
				const res = await fetch('/api/users/');
				if (res.ok) {
					users = await res.json();
					users.forEach(user => {
						user.listAvatar = generateProfileImage(user, 24, 24);
					});
				}
			} catch (err) {
				console.error('Failed to fetch invite list:', err);
			}

			const card = new Card();
			const renderedRows = await Promise.all(users.map(async user => {
				const inviteBtnRaw = await button.renderButton({
					id: `invite-${user.id}`,
					text: 'Invite',
					className: 'btn-sm btn-primary invite-btn',
					type: 'button',
					onClick: '',
				});
				const inviteBtn = inviteBtnRaw.replace('<button', `<button data-user="${user.id}"`);

				return `
					<tr>
						<td>${user.listAvatar}</td>
						<td>${user.username}</td>
						<td class="text-right">${inviteBtn}</td>
					</tr>
				`;
			}));

			inviteListCard = await card.renderCard({
				title: 'Invite List',
				extra: `
					<table class="list" data-height="300px">
						<thead><tr><th>Avatar</th><th>Username</th><th></th></tr></thead>
						<tbody>${renderedRows.join('\n')}</tbody>
					</table>
				`,
				data: { users }
			});
		}

		// 🧩 Combine layout
		const lobbyLayout = `
		<div class="lobby-layout">
			<div class="invite-list" style="${this.User2.status === 'unavailable' ? '' : 'hidden'}">
				${inviteListCard}
			</div>
			<div class="lobby-center text-center ${this.User2.status === 'unavailable' ? 'hidden' : ''}">
				${player1Btn}
				<div class="vs my-2 font-bold text-lg">VS</div>
				${player2Btn}
			</div>
			<div class="lobby-actions mt-4" style="${this.User2.status === 'unavailable' ? 'hidden' : ''}">
				${actionButtonsGroup}
			</div>
		</div>
`;


		const playerStatusCard = await new Card().renderCard({
			title: 'Match Setup',
			extra: lobbyLayout
		});

		return this.render(`
			<div class="container">
				${titleSection}
				${playerStatusCard}
				${debugSimulateButton}
			</div>
		`);
	}

	async mount(): Promise<void> {
		setTimeout(() => {

			document.addEventListener('LobbyPlayerJoined', (e: any) => {
				if (e.detail.lobbyId === this.lobbyId) {
					document.querySelector('.invite-list')?.classList.add('hidden');
					document.querySelector('.lobby-center')?.classList.remove('hidden');
					document.querySelector('.lobby-actions')?.classList.remove('hidden');
				}
			});


			document.getElementById('startGameBtn')?.addEventListener('click', (e) => {
				e.preventDefault();
				const startBtn = e.currentTarget as HTMLButtonElement;

				if (startBtn.classList.contains('btn-success')) {
					console.log('Redirecting to Pong...');
					Router.redirect(`/pong/${this.lobbyId}`);
				} else {
					console.log('Start Game not ready.');
				}
			});

			document.getElementById('readyBtn')?.addEventListener('click', () => {
				const readyBtn = document.getElementById('readyBtn') as HTMLButtonElement;
				const player1 = document.getElementById('player1') as HTMLButtonElement;
				const player2 = document.getElementById('player2') as HTMLButtonElement;
				const startGameBtn = document.getElementById('startGameBtn') as HTMLButtonElement;

				const isNowReady = player1.classList.contains('btn-success');
				const isPlayer2Unavailable = player2.classList.contains('btn-danger');

				if (isPlayer2Unavailable) {
					readyBtn.disabled = true;
					return;
				}

				if (isNowReady) {
					this.User1.status = 'waiting';
					player1.classList.remove('btn-success');
					player1.classList.add('btn-warning');
					player1.textContent = `${this.User1.username} (Waiting)`;
					readyBtn.textContent = 'Ready';
				} else {
					this.User1.status = 'ready';
					lobbyService.markReady(this.User1.username, this.lobbyId);
					player1.classList.remove('btn-warning', 'btn-danger');
					player1.classList.add('btn-success');
					player1.textContent = `${this.User1.username} (Ready)`;
					readyBtn.textContent = 'Unready';
				}

				const user1Ready = this.User1.status === 'ready';
				const user2Ready = player2.classList.contains('btn-success');

				if (user1Ready && user2Ready) {
					startGameBtn.classList.remove('btn-danger', 'btn-warning');
					startGameBtn.classList.add('btn-success');
					startGameBtn.textContent = 'Start Game';
					startGameBtn.classList.remove('cursor-not-allowed', 'opacity-60');
					startGameBtn.setAttribute('href', `/pong/${this.lobbyId}`);
				} else if (this.User1.status === 'waiting' || player2.classList.contains('btn-warning')) {
					startGameBtn.classList.remove('btn-danger', 'btn-success');
					startGameBtn.classList.add('btn-warning');
					startGameBtn.textContent = 'Wait for Invite acception';
					startGameBtn.removeAttribute('href');
					startGameBtn.classList.add('cursor-not-allowed', 'opacity-60');
				} else {
					startGameBtn.classList.remove('btn-success', 'btn-warning');
					startGameBtn.classList.add('btn-danger');
					startGameBtn.textContent = 'Invite Players to start game';
					startGameBtn.removeAttribute('href');
					startGameBtn.classList.add('cursor-not-allowed', 'opacity-60');
				}
			});

			document.getElementById('leaveBtn')?.addEventListener('click', () => {
				lobbyService.leaveLobby(this.lobbyId);
			});

			document.querySelectorAll('.invite-btn')?.forEach(button => {
				button.addEventListener('click', (e) => {
					const btn = e.currentTarget as HTMLButtonElement;
					const userId = btn.getAttribute('data-user');
					if (!userId) return;

					if (btn.textContent === 'Pending...') {
						btn.textContent = 'Invite';
						btn.classList.remove('btn-warning');
						btn.classList.add('btn-primary');
						btn.disabled = false;
						return;
					}

					console.log(`Invite sent to user ${userId}`);
					lobbyService.sendInvite(userId, this.lobbyId);
					btn.textContent = 'Pending...';
					btn.classList.remove('btn-primary');
					btn.classList.add('btn-warning');
					btn.disabled = false;
				});
			});

			const simulateBtn = document.getElementById('simulatePlayer2Ready') as HTMLButtonElement;
			simulateBtn?.addEventListener('click', () => {
				const player2 = document.getElementById('player2') as HTMLButtonElement;

				// Initial state: accept invitation
				if (this.User2.status === 'unavailable') {
					console.log('ready');
					this.User2.status = 'waiting';
					player2.classList.remove('btn-danger');
					player2.classList.add('btn-warning');
					player2.textContent = `${this.User2.username} (Waiting)`;
					simulateBtn.textContent = 'Set Ready';

					document.dispatchEvent(new CustomEvent('LobbyPlayerJoined', {
						detail: { lobbyId: this.lobbyId }
					}));
					return;
				}

				// Toggle between waiting and ready
				if (this.User2.status === 'waiting') {
					this.User2.status = 'ready';
					player2.classList.remove('btn-warning');
					player2.classList.add('btn-success');
					player2.textContent = `${this.User2.username} (Ready)`;
					simulateBtn.textContent = 'Set Unready';
				} else {
					this.User2.status = 'waiting';
					player2.textContent = `${this.User2.username} (Waiting)`;
					simulateBtn.textContent = 'Set Ready';
				}
			});

		}, 0);
	}
}
