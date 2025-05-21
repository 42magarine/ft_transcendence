import AbstractView from '../../utils/AbstractView.js';
import Title from '../components/Title.js';
import Button from '../components/Button.js';
import Card from '../components/Card.js';
import lobbyService from '../services/LobbyService.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import Router from '../../utils/Router.js';
import UserService from '../services/UserService.js'

interface UserList {
    // listAvatar: string;
    id?: number;
    username: string;
    email: string;
    displayname?: string;
    role?: string;
}

type PlayerStatus = 'ready' | 'waiting' | 'unavailable';

export default class Lobby extends AbstractView {
    private currentUser: UserList | null = null;
    private userService = new UserService();
    private lobbyInfo: any = null;
    private lobbyId: string;

    // Local representation of two players
    private currentPlayer = { username: 'You', status: 'waiting' as PlayerStatus };
    private opponentPlayer = { username: 'Bob', status: 'unavailable' as PlayerStatus };

    constructor(params: URLSearchParams) {
        super();
        this.lobbyId = params.get('id') || '';
    }

    async getHtml(): Promise<string> {

        this.currentUser = await this.userService.getCurrentUser();
        this.currentPlayer.username = this.currentUser?.username || 'You';

        // Fetch lobby data from backend to identify participants
        try {
            const res = await fetch(`/api/lobbies/${this.lobbyId}`);
            if (res.ok) {
                this.lobbyInfo = await res.json();
                const opponent = this.lobbyInfo.participants.find(
                    (p: any) => p.id !== this.currentUser?.id
                );
                if (opponent) {
                    this.opponentPlayer.username = opponent.username;
                    this.opponentPlayer.status = 'waiting'; // or fetch from backend if you store status
                }
            }
        } catch (err) {
            console.error('Failed to fetch lobby data:', err);
        }

        const title = new Title({ title: `Lobby #${this.lobbyId}` });

        // Simulate button for debugging UI behavior
        const debugSimulateButton = `
			<div class="text-right mt-4">
				<button id="simulatePlayer2Ready" class="btn btn-secondary btn-sm">Simulate Player 2 accept invite</button>
			</div>
		`;

        const titleSection = await title.getHtml();

        const button = new Button();
        const player1Btn = await button.renderButton({
            id: 'player1',
            text: this.currentPlayer.username,
            status: this.currentPlayer.status,
        });
        const player2Btn = await button.renderButton({
            id: 'player2',
            text: this.opponentPlayer.username,
            status: this.opponentPlayer.status,
        });

        // Determine start button status based on both players' readiness
        let startStatus: 'unavailable' | 'waiting' | 'ready' = 'unavailable';
        if (this.currentPlayer.status === 'ready' && this.opponentPlayer.status === 'ready') {
            startStatus = 'ready';
        } else if (this.currentPlayer.status === 'waiting' || this.opponentPlayer.status === 'waiting') {
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

        // Ready button styling depending on if player2 is available
        const isPlayer2Unavailable = this.opponentPlayer.status === 'unavailable';
        const readyButtonConfig = {
            id: 'readyBtn',
            text: this.currentPlayer.status === 'ready' ? 'Unready' : 'Ready',
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

        // 👥 Invite list display only when player 2 hasn’t joined
        let users: UserList[] = [];
        let inviteListCard = '';
        if (this.opponentPlayer.status === 'unavailable') {
            try {
                const res = await fetch('/api/users/');
                if (res.ok) {
                    users = await res.json();
                    // users.forEach(user => {
                    //     user.listAvatar = generateProfileImage(user, 24, 24);
                    // });
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

        // Main lobby layout combining all parts
        const lobbyLayout = `
		<div class="lobby-layout">
			<div class="invite-list" style="${this.opponentPlayer.status === 'unavailable' ? '' : 'hidden'}">
				${inviteListCard}
			</div>
			<div class="lobby-center text-center ${this.opponentPlayer.status === 'unavailable' ? 'hidden' : ''}">
				${player1Btn}
				<div class="vs my-2 font-bold text-lg">VS</div>
				${player2Btn}
			</div>
			<div class="lobby-actions mt-4" style="${this.opponentPlayer.status === 'unavailable' ? 'hidden' : ''}">
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

    // This method sets up DOM interactions after HTML has rendered
    async mount(): Promise<void> {
        setTimeout(() => {

            // Handle real player joining via WebSocket
            //  {
            //     "type": "playerJoined",
            //     "lobbyId": "abc123",
            //     "userId": 5,
            //     "username": "realPlayer2"
            //   }
            document.addEventListener('LobbyPlayerJoined', (e: any) => {
                if (e.detail.lobbyId === this.lobbyId) {
                    document.querySelector('.invite-list')?.classList.add('hidden');
                    document.querySelector('.lobby-center')?.classList.remove('hidden');
                    document.querySelector('.lobby-actions')?.classList.remove('hidden');
            
                    this.opponentPlayer.username = e.detail.username || 'Opponent';
                    this.opponentPlayer.status = 'waiting';
                    const player2 = document.getElementById('player2') as HTMLButtonElement;
                    if (player2) {
                        player2.textContent = `${this.opponentPlayer.username} (Waiting)`;
                        player2.classList.remove('btn-danger');
                        player2.classList.add('btn-warning');
                    }
                }
            });

            // Start game button logic
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

            // Ready/unready toggle logic
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
                    this.currentPlayer.status = 'waiting';
                    player1.classList.remove('btn-success');
                    player1.classList.add('btn-warning');
                    player1.textContent = `${this.currentPlayer.username} (Waiting)`;
                    readyBtn.textContent = 'Ready';
                } else {
                    this.currentPlayer.status = 'ready';
                    lobbyService.markReady(this.currentPlayer.username, this.lobbyId);
                    player1.classList.remove('btn-warning', 'btn-danger');
                    player1.classList.add('btn-success');
                    player1.textContent = `${this.currentPlayer.username} (Ready)`;
                    readyBtn.textContent = 'Unready';
                }

                // Update start button based on readiness
                const user1Ready = this.currentPlayer.status === 'ready';
                const user2Ready = player2.classList.contains('btn-success');

                if (user1Ready && user2Ready) {
                    startGameBtn.classList.remove('btn-danger', 'btn-warning');
                    startGameBtn.classList.add('btn-success');
                    startGameBtn.textContent = 'Start Game';
                    startGameBtn.classList.remove('cursor-not-allowed', 'opacity-60');
                    startGameBtn.setAttribute('href', `/pong/${this.lobbyId}`);
                } else if (this.currentPlayer.status === 'waiting' || player2.classList.contains('btn-warning')) {
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

            // Leave lobby handler
            document.getElementById('leaveBtn')?.addEventListener('click', () => {
                lobbyService.leaveLobby(this.lobbyId);
            });

            // Invite other users to join the lobby
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

            // Simulate Player 2 joining and toggling status
            const simulateBtn = document.getElementById('simulatePlayer2Ready') as HTMLButtonElement;
            simulateBtn?.addEventListener('click', () => {
                const player2 = document.getElementById('player2') as HTMLButtonElement;

                // Initial state: accept invitation
                if (this.opponentPlayer.status === 'unavailable') {
                    console.log('ready');
                    this.opponentPlayer.status = 'waiting';
                    player2.classList.remove('btn-danger');
                    player2.classList.add('btn-warning');
                    player2.textContent = `${this.opponentPlayer.username} (Waiting)`;
                    simulateBtn.textContent = 'Set Ready';

                    document.dispatchEvent(new CustomEvent('LobbyPlayerJoined', {
                        detail: { lobbyId: this.lobbyId }
                    }));
                    return;
                }

                // Toggle between waiting and ready
                if (this.opponentPlayer.status === 'waiting') {
                    this.opponentPlayer.status = 'ready';
                    player2.classList.remove('btn-warning');
                    player2.classList.add('btn-success');
                    player2.textContent = `${this.opponentPlayer.username} (Ready)`;
                    simulateBtn.textContent = 'Set Unready';
                } else {
                    this.opponentPlayer.status = 'waiting';
                    player2.textContent = `${this.opponentPlayer.username} (Waiting)`;
                    simulateBtn.textContent = 'Set Ready';
                }
            });

        }, 0);
    }
}

// TODO [Frontend]: Fetch actual current user from UserService instead of default 'You'
// TODO [Frontend]: Replace 'Bob' with real opponent username when invite is accepted (e.detail.userId)
// TODO [Frontend]: Listen for real WebSocket "playerJoined" message and trigger 'LobbyPlayerJoined' event
// TODO [Frontend]: When real player joins (not just simulated), auto-switch UI to VS view
// TODO [Frontend]: Update opponentPlayer.status and name dynamically in the LobbyPlayerJoined listener

// TODO [Backend]: When receiving { type: 'acceptInvite', userId, lobbyId }, do:
    // - Find GameModel by lobbyId
    // - Add user to lobbyParticipants if not full
    // - Save GameModel
    // - Broadcast to all clients in that lobby:
    //      { type: 'playerJoined', lobbyId, userId }

// TODO [Backend]: Enforce maxPlayers limit (e.g., 2 players only)
// TODO [Backend]: Optional: add user status (e.g., 'ready') to GameModel (via JSON map or extra table)
// TODO [Backend]: On 'leaveLobby', remove player from lobbyParticipants, update lobby state
// TODO [Backend]: On 'startGame', set GameModel.status = 'ongoing' and set startedAt

