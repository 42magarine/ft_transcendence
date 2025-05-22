// This file defines the Lobby frontend view and behavior.
// It expects the backend to support lobby state handling, user invites, and game start logic.

import AbstractView from '../../utils/AbstractView.js';
import Title from '../components/Title.js';
import Button from '../components/Button.js';
import Card from '../components/Card.js';
import lobbyService from '../services/LobbyService.js';
import Router from '../../utils/Router.js';
import UserService from '../services/UserService.js';

interface UserList
{
	id?: number;
	username: string;
	email: string;
	displayname?: string;
	role?: string;
	hasClickedStart?: boolean;
	isJoined?: boolean;
	isCreator?: boolean;
}

export default class Lobby extends AbstractView
{
	private currentUser: UserList | null = null;
	private userService = new UserService();
	private lobbyInfo: any = null;
	private lobbyId: string;
	private lastInvitedUser: UserList | null = null;
	private users: UserList[] = [];

	private currentPlayer: UserList = { username: '', email: '', hasClickedStart: false, isJoined: true };
	private opponentPlayer: UserList = { username: '', email: '', hasClickedStart: false, isJoined: false };

	constructor(params: URLSearchParams)
	{
		super();
		this.lobbyId = params.get('id') || '';
	}

	private updateDebugCard(): void
	{
		const debugDiv = document.getElementById('debug-info');
		if (!debugDiv)
				return;

		debugDiv.innerHTML = `
			<div class="w-1/2"><h3>Player 1</h3><pre>${JSON.stringify(this.currentPlayer, null, 2)}</pre></div>
			<div class="w-1/2"><h3>Player 2</h3><pre>${JSON.stringify(this.opponentPlayer, null, 2)}</pre></div>
		`;
		console.log('[UI] Debug card updated');
	}

	async getHtml(): Promise<string> {
		// BACKEND: must provide current user (id, username, email, etc.)
		this.currentUser = await this.userService.getCurrentUser();
		console.log('[Init] Current user:', this.currentUser);

		if (this.currentUser)
		{
			this.currentPlayer = {
				...this.currentUser,
				hasClickedStart: false,
				isJoined: true,
				isCreator: false
			};
			this.updateDebugCard();
		}

		if (this.currentPlayer.isCreator && this.currentUser)
		{
			// 👤 You are the one joining, so you should become Player 2
			this.opponentPlayer = {
				...this.currentUser,
				hasClickedStart: false,
				isJoined: true,
				isCreator: true
			};

			// 🧑 Host is Player 1 (simulate them)
			this.currentPlayer = {
				id: 100,
				username: 'HostPlayer',
				email: 'host@sim.lobby',
				hasClickedStart: false,
				isJoined: true,
				isCreator: true
			};
			this.updateDebugCard();
		}
		else
		{
			// BACKEND: must provide full lobby info with `participants[]`
			try {
				const res = await fetch(`/api/lobbies/${this.lobbyId}`);
				if (res.ok) {
					this.lobbyInfo = await res.json();
					console.log('[Init] Lobby info:', this.lobbyInfo);

					// BACKEND: participants must be an array of users
					const opponent = this.lobbyInfo.participants.find((p: any) => p.id !== this.currentUser?.id);
					if (opponent) {
						this.opponentPlayer = {
							...opponent,
							hasClickedStart: false,
							isJoined: true,
						};
						this.updateDebugCard();
					}
				}
			} catch (err) {
				console.error('Failed to fetch lobby data:', err);
			}
		}

		const title = new Title({ title: `Lobby ${this.lobbyId}` });
		const titleSection = await title.getHtml();
		const button = new Button();

		// button for player vs player view
		const player1Btn = await button.renderButton({
			id: 'player1',
			text: this.currentPlayer.username,
			className: this.currentPlayer.hasClickedStart? 'btn btn-secondary' : 'btn btn-warning',
			type: 'button'
		});

		// button for player vs player view
		const player2Btn = await button.renderButton({
			id: 'player2',
			text: this.opponentPlayer.username,
			className: this.opponentPlayer.hasClickedStart? 'btn btn-secondary' : 'btn btn-warning',
			type: 'button'
		});

		// button to start the game, sets hasClickedStart to ready for currentplayer, redirect to pong, if both true
		const startGameButton = {
			id: 'startGameBtn',
			text: 'Start Game',
			className: 'btn btn-secondary cursor-not-allowed opacity-60',
			type: 'button' as const
		};

		// leaves lobby, should reset lobby variables from user to default
		const actionButtonsGroup = await button.renderGroup({
			layout: 'group',
			align: 'center',
			buttons: [
				startGameButton,
				{ id: 'leaveBtn', text: 'Leave Lobby', className: 'btn btn-danger', type: 'button', href: '/lobbylist' }
			]
		});

		this.users = [];

		// will be visible, when player creates lobby, and invites players, will be hidden, if opponent accept (joinlobby)
		let inviteListCard = '';
		if (!this.opponentPlayer.isJoined) {
			// BACKEND: must return array of user objects to invite
			try {
				const res = await fetch('/api/users/');
				if (res.ok) {
					this.users = await res.json();
					console.log('[Invite] User list fetched:', this.users);
				}
			} catch (err) {
				console.error('Failed to fetch invite list:', err);
			}

			const card = new Card();
			const renderedRows = await Promise.all(this.users.map(async user => {
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

		// player vs player view
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

		// will print debug card to show both player variables
		const debugCard = await new Card().renderCard({
			title: 'Debug Info',
			extra: `<div id="debug-info" class="flex gap-4">
				<div class="w-1/2"><h3>Player 1</h3><pre>${JSON.stringify(this.currentPlayer, null, 2)}</pre></div>
				<div class="w-1/2"><h3>Player 2</h3><pre>${JSON.stringify(this.opponentPlayer, null, 2)}</pre></div>
			</div>`
		});

		// debug to show, if we are in creator or joiner view
		const simNotice = `<div class="text-sm text-yellow-500 font-mono mb-2">
			Simulating: ${this.currentPlayer.isCreator ? 'Created Lobby' : 'Joined Lobby'}
		</div>`;

		return this.render(`
			<div class="container">
				${simNotice}
				${titleSection}
				${playerStatusCard}
				${debugCard}
				<div class="text-right mt-4 space-x-2">
					<button id="ToggleSim" class="btn btn-info btn-sm">Switch Simulation Mode</button>
					<button id="opponentPlayerReady" class="btn btn-secondary btn-sm">Simulate opponent Player accept invite</button>
					<button id="opponentPlayerStart" class="btn btn-warning btn-sm">Simulate opponent Player start game</button>
				</div>
			</div>
		`);
	}
	async mount(): Promise<void>
	{
		setTimeout(() =>
		{

			// 🟢 Event listener triggered when an invited player joins the lobby, coming from backend
			// Sets the opponentPlayer's data, updates debug info and UI.
			// Only fires if the joining user matches the `lastInvitedUser` and lobby ID matches.
			// After joining, the invite list is hidden and the main player-vs-player layout is shown.
			document.addEventListener('LobbyPlayerJoined', (e: any) =>
			{
				console.log('[Event] LobbyPlayerJoined triggered:', e.detail);

				// BACKEND: should emit this event when opponent joins
				if (e.detail.lobbyId !== this.lobbyId || !this.lastInvitedUser) {
					console.warn('[LobbyPlayerJoined] Ignored due to mismatched lobbyId or missing lastInvitedUser');
					return;
				}

				this.opponentPlayer = {
					...e.detail,
					hasClickedStart: false,
					isJoined: true
				};
				console.log('[State] Opponent joined:', this.opponentPlayer);
				this.updateDebugCard();

				const player2 = document.getElementById('player2') as HTMLButtonElement;
				if (player2) {
					player2.textContent = `${this.opponentPlayer.username}`;
				}

				document.querySelector('.invite-list')?.classList.add('hidden');
				document.querySelector('.lobby-center')?.classList.remove('hidden');
				document.querySelector('.lobby-actions')?.classList.remove('hidden');
			});

			// 🎮 Handles the current player's attempt to start the game.
			// - Prevents multiple clicks or starting if already clicked.
			// - Sets `hasClickedStart` to true for current player.
			// - Updates UI to show "Waiting for Opponent...".
			// - Emits `LobbyPlayerClickedStart` event to notify others in the lobby.
			document.getElementById('startGameBtn')?.addEventListener('click', () =>
			{
				console.log('[Click] Start Game button');

				if (this.currentPlayer.hasClickedStart)
				{
					console.warn(this.currentPlayer.username);
					console.warn('[StartGame] Click ignored: Opponent not joined or already clicked');
					return;
				}

				this.currentPlayer.hasClickedStart = true;
				console.log('[State] Current player clicked start');
				this.updateDebugCard();

				const btn = document.getElementById('startGameBtn') as HTMLButtonElement;
				btn.textContent = 'Waiting for Opponent...';
				btn.classList.add('btn-warning');

				// BACKEND: should emit this event to all lobby members
				document.dispatchEvent(new CustomEvent('LobbyPlayerClickedStart', {
					detail: { lobbyId: this.lobbyId, userId: this.currentUser?.id }
				}));
			});

			// ✅ Handles the event when any player clicks "Start".
			// - Checks if the event belongs to the current lobby.
			// - Sets `hasClickedStart` for the appropriate player (current or opponent).
			// - Updates the UI to reflect "Ready" status.
			// - If both players are ready, redirects to the game route.
			// - Otherwise, updates the "Start Game" button to allow the second click.
			document.addEventListener('LobbyPlayerClickedStart', (e: any) =>
			{
				console.log('[Event] LobbyPlayerClickedStart triggered:', e.detail);

				if (e.detail.lobbyId !== this.lobbyId)
				{
					console.warn('[LobbyPlayerClickedStart] Ignored due to mismatched lobbyId');
					return;
				}
				const userId = e.detail.userId;

				// Set clickedStart flags
				if (userId === this.currentUser?.id)
				{
					this.currentPlayer.hasClickedStart = true;
					console.log('[State] Current player start confirmed');
				}
				else
				{

					const player2 = document.getElementById('player2') as HTMLButtonElement;
					if (player2)
					{
						player2.textContent = `${this.opponentPlayer.username} (Ready)`;
						player2.classList.remove('btn-danger', 'btn-secondary');
						player2.classList.add('btn-success');
					}
				}

				this.updateDebugCard();

				const btn = document.getElementById('startGameBtn') as HTMLButtonElement;

				if (this.currentPlayer.hasClickedStart && this.opponentPlayer.hasClickedStart)
				{
					console.log('[Game] Both players ready. Redirecting to game...');
					Router.redirect(`/pong/${this.lobbyId}`);
				}
				else
				{
					if (userId !== this.currentUser?.id && btn)
					{
						console.log('[Game] Opponent ready. Waiting for current player to click again.');
						btn.textContent = 'Opponent Ready. Click again to Start.';
						btn.classList.remove('cursor-not-allowed', 'opacity-60', 'btn-warning');
						btn.classList.add('btn-success');
					}
				}
			});

			// 🔚 Handles the "Leave Lobby" button click.
			// - Calls the `leaveLobby` method to notify the backend.
			// - Should also reset local state (e.g., `currentPlayer`, `opponentPlayer`, etc.) if needed.
			// - Intended to redirect the user to the lobby list or previous screen after leaving.

			document.getElementById('leaveBtn')?.addEventListener('click', () =>
			{
				console.log('[Click] Leave Lobby');
				lobbyService.leaveLobby(this.lobbyId);
			});

			// 🎯 Handle invite button clicks for all listed users.
			// When a user is invited:
			// - The button becomes 'Pending...' and changes styling.
			// - The invited user is saved as `lastInvitedUser` for simulation/testing.
			// - The debug card updates to reflect the invitation state.
			// - An invite is sent to the backend using `lobbyService.sendInvite`.
			document.querySelectorAll('.invite-btn')?.forEach(button =>
			{
				button.addEventListener('click', (e) =>
				{
					const btn = e.currentTarget as HTMLButtonElement;
					const userId = btn.getAttribute('data-user');
					const username = btn.closest('tr')?.querySelector('td')?.textContent?.trim() || 'Guest';

					console.log('[Click] Invite user:', userId, username);

					const matchedUser = this.users.find((u) => u.id?.toString() === userId);
					if (!matchedUser)
					{
						console.warn('[Invite] No matched user found for ID:', userId);
						return;
					}

					// FRONTEND: stores invited user, should be fetched from matched users default variables
					this.lastInvitedUser = {
						...matchedUser,
						hasClickedStart: false,
						isJoined: false,
					};

					console.log('[State] lastInvitedUser set to:', this.lastInvitedUser);
					this.updateDebugCard();

					lobbyService.sendInvite(userId!, this.lobbyId);
					btn.textContent = 'Pending...';
					btn.classList.remove('btn-primary');
					btn.classList.add('btn-warning');
					btn.disabled = false;
				});
			});

			//
			//----------------------------- simulating debug buttons ----------------------------
			//

			// Simulates the opponent accepting the invite (joining the lobby)
			document.getElementById('opponentPlayerReady')?.addEventListener('click', () =>
			{
				console.log('[Click] Simulate opponent player clicks on start game');

				if (!this.lastInvitedUser)
				{
					console.warn('[Simulate Ready] No invited user found');
					return;
				}

				// SIMULATION: simulate player joined event
				document.dispatchEvent(new CustomEvent('LobbyPlayerJoined', {
					detail: { lobbyId: this.lobbyId, ...this.lastInvitedUser }
				}));
			});

			//  Simulates the opponent clicking "Start Game"
			document.getElementById('opponentPlayerStart')?.addEventListener('click', () =>
			{
				console.log('[Click] Simulate Start from opponent player');

				if (this.currentPlayer.isCreator)
				{
					if (this.opponentPlayer.hasClickedStart || !this.opponentPlayer.isJoined)
					{
						console.warn('[Simulate Start] Opponent not ready or already clicked');
						return;
					}
					this.opponentPlayer.hasClickedStart = true;
					console.log('[Simulate Start] Simulating Player 2 clicking start');
					this.updateDebugCard();

					document.dispatchEvent(new CustomEvent('LobbyPlayerClickedStart', {
						detail: { lobbyId: this.lobbyId, userId: this.opponentPlayer.id }
					}));
				}
				else
				{
					if (this.currentPlayer.hasClickedStart)
					{
						console.warn('[Simulate Start] Already clicked');
						return;
					}
					this.currentPlayer.hasClickedStart = true;
					console.log('[Simulate Start] Simulating Player 1 (joiner) clicking start');
					this.updateDebugCard();

					document.dispatchEvent(new CustomEvent('LobbyPlayerClickedStart', {
						detail: { lobbyId: this.lobbyId, userId: this.currentUser?.id }
					}));
				}
			});

			//  Switch between simulated creator and simulated joiner
			document.getElementById('ToggleSim')?.addEventListener('click', async () =>
			{
				console.log('[Click] Toggle Simulation Mode');

				// Swap creator status
				const wasCreator = this.currentPlayer.isCreator;

				// Reset player roles
				if (wasCreator)
				{
					this.currentPlayer.hasClickedStart = false;
					this.currentPlayer.isJoined = true;
					this.currentPlayer.isCreator = true

					this.opponentPlayer.hasClickedStart = false;
					this.opponentPlayer.isJoined = true;
					this.opponentPlayer.isCreator = false;
				}
				else
				{
					this.currentPlayer.hasClickedStart = false;
					this.currentPlayer.isJoined = true;
					this.currentPlayer.isCreator = false;

						this.opponentPlayer.hasClickedStart = false;
						this.opponentPlayer.isJoined = true;
						this.opponentPlayer.isCreator = true;
				}

				console.log('[ToggleSim] Switched roles:', {
					currentPlayer: this.currentPlayer,
					opponentPlayer: this.opponentPlayer
				});
				this.updateDebugCard();
			});
		}, 0);
	}
}
