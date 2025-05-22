import AbstractView from '../../utils/AbstractView.js';
import Title from '../components/Title.js';
import Button from '../components/Button.js';
import Card from '../components/Card.js';
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

        const card = new Card();
        this.currentUser = await UserService.getCurrentUser();
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

        const vsCard = await card.renderCard({
            title: '',
            extra:
                `<p class="vs">Marvin <--> digge</p>`
        });
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
				<div class="flex gap-4">
					<div>
						${playerStatusCard}
					</div>
					<div>
						${vsCard}
					</div>
				</div>
			</div>
		`);
    }
}
