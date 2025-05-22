import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Title from '../components/Title.js';
import lobbyService from '../services/LobbyService.js';
import { LobbyInfo } from '../../interfaces/interfaces.js';
import Button from '../components/Button.js';
import { randomInt } from 'crypto';

export default class Lobby extends AbstractView {
	private lobbyData: LobbyInfo[] = [];
	private invitedLobby: LobbyInfo | null = null;

	constructor(params: URLSearchParams) {
		super();
		this.params = params;
	}

	async getHtml(): Promise<string> {
		const title = new Title({ title: 'Available Lobbies' });
		const titleSection = await title.getHtml();

		const button = new Button();
		const createLobbyButton = await button.renderButton({
			id: 'createLobbyBtn',
			text: 'Create Lobby',
			type: 'submit',
			className: 'btn btn-primary'
		});

		// ✅ DEBUG: Test button for manually simulating lobby invite reception
		const testInviteButton = `
			<div class="text-right mb-3">
				<button id="testInviteBtn" class="btn btn-secondary btn-sm">Add Test Invited Lobby</button>
			</div>
		`;

		const card = new Card();
		const placeholderCard = await card.renderCard({
			title: 'Lobby List',
			extra: `<div>Loading lobbies...</div>`,
		});

		// Register callback to listen for lobby updates via WebSocket or polling
		lobbyService.registerLobbyListListener(() => {
			this.lobbyData = lobbyService.getLobbyList();
			this.updateLobbyList(); // Refresh the lobby UI
		});

		// Handle simulated or real invite event
		document.addEventListener('LobbyInviteReceived', (e: any) => {
			const { lobbyId, userId } = e.detail;

			this.invitedLobby = {
				id: lobbyId,
				name: lobbyId,
				creatorId: userId,
				currentPlayers: 1,
				maxPlayers: 2,
				isStarted: false,
				isPublic: true,
				hasPassword: false,
				createdAt: new Date(),
				lobbyType: 'game'
			};

			this.updateLobbyList();
		});

		// TODO: Replace `safeSend({ type: 'getLobbyList' })` with actual persistent WebSocket listener if not already done
		lobbyService.safeSend({ type: 'getLobbyList' });

		return this.render(`
			<div class="container">
				${titleSection}
				${testInviteButton}
				${createLobbyButton}
				<div class="card-container">
					${placeholderCard}
				</div>
			</div>
		`);
	}

	async mount(): Promise<void> {
		setTimeout(() => {
			// ✅ Simulate an invite (test only)
			document.getElementById('testInviteBtn')?.addEventListener('click', () => {
				const randomId = `test-lobby-${Math.floor(Math.random() * 10000)}`;
				const randomUserId = Math.floor(Math.random() * 1000);

				// TODO: In production, remove this block or gate it behind dev flag
				document.dispatchEvent(new CustomEvent('LobbyInviteReceived', {
					detail: {
						lobbyId: randomId,
						userId: randomUserId
					}
				}));
			});

			// 👤 User clicks "Accept Invite" on a specific lobby row
			// TODO: Ensure this binding still works after lobby list is updated (may need delegation or re-bind)
			document.querySelectorAll('.accept-invite-btn')?.forEach(btn => {
				btn.addEventListener('click', (e) => {
					e.preventDefault();
					const el = e.currentTarget as HTMLAnchorElement;
					const lobbyId = el.getAttribute('data-lobby');
					const userId = el.getAttribute('data-user');

					if (lobbyId && userId) {
						// TODO: Backend must emit a `LobbyPlayerJoined` event so lobby view can switch from invite list to player view
						lobbyService.acceptInvite(userId, lobbyId);
					}
				});
			});
		}, 0);
	}

	private async updateLobbyList() {
		const container = document.querySelector('.card-container');
		if (!container) return;

		const lobbiesToShow = [...this.lobbyData];
		if (this.invitedLobby) {
			// Put invited lobby at the top
			lobbiesToShow.unshift(this.invitedLobby);
		}

		const card = new Card();
		const updatedCardHtml = await card.renderCard({
			title: 'Lobby List',
			extra: this.buildLobbyTable(lobbiesToShow),
			data: { lobbies: lobbiesToShow }
		});

		// Replace current list with updated HTML
		container.innerHTML = updatedCardHtml;
	}

	// Build lobby list table with join or invite button
	private buildLobbyTable(lobbies: LobbyInfo[]): string {
		return `
			<table class="list" data-height="400px">
				<thead>
					<tr>
						<th>Lobby Name</th>
						<th>ID</th>
						<th>Creator ID</th>
						<th>Players</th>
						<th>Status</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					${lobbies.map(lobby => {
						const isInvite = this.invitedLobby?.id === lobby.id;
						return `
							<tr class="${isInvite ? 'invited-lobby-row' : ''}">
								<td>${isInvite ? `Invited Lobby (${lobby.name})` : lobby.name}</td>
								<td>${lobby.id}</td>
								<td>${lobby.creatorId}</td>
								<td>${lobby.currentPlayers} / ${lobby.maxPlayers}</td>
								<td>${lobby.isStarted ? 'Started' : 'Waiting'}</td>
								<td class="text-right">
                                    ${
                                        isInvite
                                            ? `<a class="btn btn-accent accept-invite-btn" data-lobby="${lobby.id}" data-user="${lobby.creatorId}" href="/lobby/${lobby.id}">Accept Invite</a>`
                                            : `<a router class="btn btn-primary" href="/lobby/${lobby.id}">Join Lobby</a>`
                                    }
                                </td>
							</tr>
						`;
					}).join('')}
				</tbody>
			</table>
		`;
	}
}
