// This file defines the Lobby frontend view and behavior.
// It expects the backend to support lobby state handling, user invites, and game start logic.

import AbstractView from '../../utils/AbstractView.js';
import Title from '../components/Title.js';
import Button from '../components/Button.js';
import Card from '../components/Card.js';
import lobbyService from '../services/LobbyService.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import Router from '../../utils/Router.js';
import UserService from '../services/UserService.js';

interface UserList {
	id?: number;
	username: string;
	email: string;
	displayname?: string;
	role?: string;
	hasClickedStart?: boolean;
	isJoined?: boolean;
}

export default class Lobby extends AbstractView {
	private currentUser: UserList | null = null;
	private userService = new UserService();
	private lobbyInfo: any = null;
	private lobbyId: string;
	private lastInvitedUser: UserList | null = null;

	private currentPlayer: UserList = { username: '', email: '', hasClickedStart: false, isJoined: true };
	private opponentPlayer: UserList = { username: '', email: '', hasClickedStart: false, isJoined: false };

	constructor(params: URLSearchParams) {
		super();
		this.lobbyId = params.get('id') || '';
	}

	async getHtml(): Promise<string> {
		this.currentUser = await this.userService.getCurrentUser();
		if (this.currentUser) {
			this.currentPlayer = {
				...this.currentUser,
				hasClickedStart: false,
				isJoined: true,
			};
		}

		try {
			const res = await fetch(`/api/lobbies/${this.lobbyId}`);
			if (res.ok) {
				this.lobbyInfo = await res.json();
				const opponent = this.lobbyInfo.participants.find((p: any) => p.id !== this.currentUser?.id);
				if (opponent) {
					this.opponentPlayer = {
						...opponent,
						hasClickedStart: false,
						isJoined: true,
					};
				}
			}
		} catch (err) {
			console.error('Failed to fetch lobby data:', err);
		}

		const title = new Title({ title: `Lobby #${this.lobbyId}` });
		const titleSection = await title.getHtml();
		const button = new Button();

		const player1Btn = await button.renderButton({
			id: 'player1',
			text: this.currentPlayer.username,
			className: 'btn btn-success',
			type: 'button'
		});
		const player2Btn = await button.renderButton({
			id: 'player2',
			text: this.opponentPlayer.username,
			className: this.opponentPlayer.isJoined ? 'btn btn-secondary' : 'btn btn-danger',
			type: 'button'
		});

		const startGameButton = {
			id: 'startGameBtn',
			text: 'Start Game',
			className: 'btn btn-secondary cursor-not-allowed opacity-60',
			type: 'button' as const
		};

		const actionButtonsGroup = await button.renderGroup({
			layout: 'group',
			align: 'center',
			buttons: [
				startGameButton,
				{ id: 'leaveBtn', text: 'Leave Lobby', className: 'btn btn-danger', type: 'button', href: '/lobbylist' }
			]
		});

		let users: UserList[] = [];
		let inviteListCard = '';
		if (!this.opponentPlayer.isJoined) {
			try {
				const res = await fetch('/api/users/');
				if (res.ok) users = await res.json();
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
				return `<tr><td>${user.username}</td><td class="text-right">${inviteBtn}</td></tr>`;
			}));

			inviteListCard = await card.renderCard({
				title: 'Invite List',
				extra: `<table class="list" data-height="300px"><thead><tr><th>Username</th><th></th></tr></thead><tbody>${renderedRows.join('\n')}</tbody></table>`
			});
		}

		const playerStatusCard = await new Card().renderCard({
			title: 'Match Setup',
			extra: `<div class="lobby-layout">
				<div class="invite-list" style="${this.opponentPlayer.isJoined ? 'display: none;' : ''}">${inviteListCard}</div>
				<div class="lobby-center text-center ${!this.opponentPlayer.isJoined ? 'hidden' : ''}">
					${player1Btn}<div class="vs my-2 font-bold text-lg">VS</div>${player2Btn}
				</div>
				<div class="lobby-actions mt-4 ${!this.opponentPlayer.isJoined ? 'hidden' : ''}">${actionButtonsGroup}</div>
			</div>`
		});

		const debugCard = await new Card().renderCard({
			title: 'Debug Info',
			extra: `<div class="flex gap-4">
				<div class="w-1/2"><h3>Player 1</h3><pre>${JSON.stringify(this.currentPlayer, null, 2)}</pre></div>
				<div class="w-1/2"><h3>Player 2</h3><pre>${JSON.stringify(this.opponentPlayer, null, 2)}</pre></div>
			</div>`
		});

		return this.render(`
			<div class="container">
				${titleSection}
				${playerStatusCard}
				${debugCard}
				<div class="text-right mt-4 space-x-2">
					<button id="Player2Ready" class="btn btn-secondary btn-sm">Simulate Player 2 accept invite</button>
					<button id="Player2Start" class="btn btn-warning btn-sm">Simulate Player 2 start game</button>
				</div>
			</div>
		`);
	}

	async mount(): Promise<void> {
		setTimeout(() => {
			document.addEventListener('LobbyPlayerJoined', (e: any) => {
				if (e.detail.lobbyId !== this.lobbyId || !this.lastInvitedUser) return;
				this.opponentPlayer = {
					...this.lastInvitedUser,
					hasClickedStart: true,
					isJoined: true
				};

				const player2 = document.getElementById('player2') as HTMLButtonElement;
				if (player2) {
					player2.textContent = `${this.opponentPlayer.username} (Ready)`;
					player2.classList.remove('btn-danger', 'btn-secondary');
					player2.classList.add('btn-success');
				}

				document.querySelector('.invite-list')?.classList.add('hidden');
				document.querySelector('.lobby-center')?.classList.remove('hidden');
				document.querySelector('.lobby-actions')?.classList.remove('hidden');
			});

			document.getElementById('startGameBtn')?.addEventListener('click', () => {
				if (!this.opponentPlayer.isJoined || this.currentPlayer.hasClickedStart) return;
				this.currentPlayer.hasClickedStart = true;
				const btn = document.getElementById('startGameBtn') as HTMLButtonElement;
				btn.textContent = 'Waiting for Opponent...';
				btn.classList.add('btn-warning');
				document.dispatchEvent(new CustomEvent('LobbyPlayerClickedStart', {
					detail: { lobbyId: this.lobbyId, userId: this.currentUser?.id }
				}));
			});

			document.addEventListener('LobbyPlayerClickedStart', (e: any) => {
				if (e.detail.lobbyId !== this.lobbyId) return;
				const userId = e.detail.userId;
				const btn = document.getElementById('startGameBtn') as HTMLButtonElement;
				if (userId === this.currentUser?.id) {
					this.currentPlayer.hasClickedStart = true;
				} else {
					this.opponentPlayer.hasClickedStart = true;
					const player2 = document.getElementById('player2') as HTMLButtonElement;
					if (player2) {
						player2.textContent = `${this.opponentPlayer.username} (Ready)`;
						player2.classList.remove('btn-danger', 'btn-secondary');
						player2.classList.add('btn-success');
					}
				}

				if (this.currentPlayer.hasClickedStart && this.opponentPlayer.hasClickedStart) {
					Router.redirect(`/pong/${this.lobbyId}`);
				} else {
					btn.textContent = 'Opponent Ready. Click again to Start.';
					btn.classList.remove('cursor-not-allowed', 'opacity-60', 'btn-warning');
					btn.classList.add('btn-success');
				}
			});

			document.getElementById('leaveBtn')?.addEventListener('click', () => {
				lobbyService.leaveLobby(this.lobbyId);
			});

			document.querySelectorAll('.invite-btn')?.forEach(button => {
				button.addEventListener('click', (e) => {
					const btn = e.currentTarget as HTMLButtonElement;
					const userId = btn.getAttribute('data-user');
					const username = btn.closest('tr')?.querySelector('td')?.textContent?.trim() || 'Guest';
					if (!userId || !username) return;
					const matchedUser = users.find((u) => u.id?.toString() === userId);
                    if (!matchedUser) return;

                    this.lastInvitedUser = {
                        ...matchedUser,
                        hasClickedStart: false,
                        isJoined: false,
                    };

					lobbyService.sendInvite(userId, this.lobbyId);
					btn.textContent = 'Pending...';
					btn.classList.remove('btn-primary');
					btn.classList.add('btn-warning');
					btn.disabled = false;
				});
			});

			document.getElementById('Player2Ready')?.addEventListener('click', () => {
				if (!this.lastInvitedUser) return;
				document.dispatchEvent(new CustomEvent('LobbyPlayerJoined', {
					detail: { lobbyId: this.lobbyId, ...this.lastInvitedUser }
				}));
			});

			document.getElementById('Player2Start')?.addEventListener('click', () => {
				if (!this.opponentPlayer.isJoined || this.opponentPlayer.hasClickedStart) return;
				document.dispatchEvent(new CustomEvent('LobbyPlayerClickedStart', {
					detail: { lobbyId: this.lobbyId, userId: this.opponentPlayer.id }
				}));
			});
		}, 0);
	}
}