// Lobby.ts
import AbstractView from '../../utils/AbstractView.js';
import Title from '../components/Title.js';
import Button from '../components/Button.js';
import Card from '../components/Card.js';
import Router from '../../utils/Router.js';
import { LobbyInfo as LobbyInfoFromServer, User } from '../../interfaces/interfaces.js';
import { LobbyParticipant, LobbyDataWithParticipants } from '../../interfaces/interfaces.js';

interface PlayerDisplayState extends Partial<LobbyParticipant> {
    isCreator?: boolean;
    isJoined?: boolean;
}

export default class Lobby extends AbstractView {
    private currentUser: User | null = null;
    private lobbyId: string;
    private usersForInviteList: User[] = [];

    private currentLobbyFullData: LobbyDataWithParticipants | null = null;
    private currentPlayerDisplay: PlayerDisplayState = { username: 'You', isJoined: false, isReady: false };
    private opponentPlayerDisplay: PlayerDisplayState = { username: 'Waiting...', isJoined: false, isReady: false };

    constructor(params: URLSearchParams) {
        super();
        this.lobbyId = params.get('id') || '';
        if (!this.lobbyId) {
            console.error("Lobby ID is missing!");
            Router.redirect('/lobbylist');
        }
        this.setTitle(`Lobby ${this.lobbyId}`);
    }

    private updatePlayerButtonsUI() {
        const player1Btn = document.getElementById('player1') as HTMLButtonElement;
        const player2Btn = document.getElementById('player2') as HTMLButtonElement;

        if (player1Btn) {
            player1Btn.textContent = `${this.currentPlayerDisplay.username || 'You'} ${this.currentPlayerDisplay.isReady ? '(Ready)' : ''}`;
            player1Btn.className = `btn ${this.currentPlayerDisplay.isReady ? 'btn-success' : (this.currentPlayerDisplay.isJoined ? 'btn-warning' : 'btn-neutral')}`;
        }
        if (player2Btn) {
            if (this.opponentPlayerDisplay.isJoined) {
                player2Btn.textContent = `${this.opponentPlayerDisplay.username || 'Opponent'} ${this.opponentPlayerDisplay.isReady ? '(Ready)' : ''}`;
                player2Btn.className = `btn ${this.opponentPlayerDisplay.isReady ? 'btn-success' : (this.opponentPlayerDisplay.isJoined ? 'btn-warning' : 'btn-neutral')}`;
            } else {
                player2Btn.textContent = "Waiting for Opponent...";
                player2Btn.className = 'btn btn-neutral';
            }
        }
    }

    private updateStartButtonUI() {
        const startGameBtn = document.getElementById('startGameBtn') as HTMLButtonElement | null;
        if (!startGameBtn || !this.currentLobbyFullData) {
            if (startGameBtn) startGameBtn.disabled = true;
            return;
        }

        const { participants } = this.currentLobbyFullData;
        const numParticipants = participants?.length || 0;
        const maxPlayers = this.currentLobbyFullData.maxPlayers || 2;

        const canStartCondition = numParticipants === maxPlayers;

        startGameBtn.disabled = false;

        if (!canStartCondition) {
            startGameBtn.textContent = `Waiting for ${maxPlayers - numParticipants} more player(s)`;
            startGameBtn.className = 'btn btn-secondary cursor-not-allowed opacity-60';
            startGameBtn.disabled = true;
        } else if (this.currentPlayerDisplay.isReady && this.opponentPlayerDisplay.isReady) {
            startGameBtn.textContent = 'Starting Game...';
            startGameBtn.className = 'btn btn-success';
            startGameBtn.disabled = true;
        } else if (this.currentPlayerDisplay.isReady) {
            startGameBtn.textContent = 'Waiting for Opponent...';
            startGameBtn.className = 'btn btn-warning';
            // Keep enabled if you allow "un-readying", otherwise disable
            // startGameBtn.disabled = true;
        } else {
            startGameBtn.textContent = 'Click when Ready';
            startGameBtn.className = 'btn btn-primary';
        }
    }

    private toggleInviteListAndMatchupVisibility() {
        const inviteListElement = document.querySelector('.invite-list-container');
        const matchupViewElement = document.querySelector('.matchup-view-container');

        const lobbyNotFull = this.currentLobbyFullData ? (this.currentLobbyFullData.participants?.length || 0) < this.currentLobbyFullData.maxPlayers : true;
        const showInviteList = !this.opponentPlayerDisplay.isJoined && this.currentPlayerDisplay.isCreator && lobbyNotFull;

        if (showInviteList) {
            inviteListElement?.classList.remove('hidden');
            matchupViewElement?.classList.add('hidden');
        } else {
            inviteListElement?.classList.add('hidden');
            matchupViewElement?.classList.remove('hidden');
        }
    }

    private updateSimNotice(): void {
        const simNoticeDiv = document.querySelector('.sim-notice') as HTMLDivElement;
        if (simNoticeDiv && this.currentUser) {
            const mode = this.currentLobbyFullData?.creatorId === this.currentUser.id ? 'Creator' : 'Joiner';
            simNoticeDiv.textContent = `Current User Mode (from data): ${mode}`;
        }
    }

    async getHtml(): Promise<string> {
        const title = new Title({ title: `Lobby ${this.lobbyId}` });
        const titleSection = await title.getHtml();
        const button = new Button();

        const player1BtnHtml = await button.renderButton({
            id: 'player1',
            text: this.currentPlayerDisplay.username || 'You',
            className: `btn ${this.currentPlayerDisplay.isReady ? 'btn-success' : (this.currentPlayerDisplay.isJoined ? 'btn-warning' : 'btn-neutral')}`,
            type: 'button'
        });

        const player2BtnHtml = await button.renderButton({
            id: 'player2',
            text: this.opponentPlayerDisplay.isJoined ? (this.opponentPlayerDisplay.username || 'Opponent') : 'Waiting for Opponent...',
            className: `btn ${this.opponentPlayerDisplay.isReady ? 'btn-success' : (this.opponentPlayerDisplay.isJoined ? 'btn-warning' : 'btn-neutral')}`,
            type: 'button'
        });

        const startGameButtonDef = {
            id: 'startGameBtn',
            text: 'Click when Ready',
            className: 'btn btn-primary',
            type: 'button' as const,
            disabled: true
        };

        const actionButtonsGroup = await button.renderGroup({
            layout: 'group',
            align: 'center',
            buttons: [
                startGameButtonDef,
                { id: 'leaveBtn', text: 'Leave Lobby', className: 'btn btn-danger', type: 'button', href: '/lobbylist' }
            ]
        });

        let inviteListCardHtml = '';

        const currentParticipantIds = this.currentLobbyFullData?.participants.map(p => p.id) || [];
        const filteredUsersForInvite = this.usersForInviteList.filter(u =>
            u.id !== this.currentUser?.id && !currentParticipantIds.includes(u.id)
        );

        if (filteredUsersForInvite.length > 0) {
            const card = new Card();
            const renderedRows = await Promise.all(filteredUsersForInvite.map(async user => {
                const inviteBtnRaw = await button.renderButton({
                    id: `invite-${user.id}`,
                    text: 'Invite',
                    className: 'btn-sm btn-primary invite-btn',
                    type: 'button',
                });
                return `<tr><td>${user.username}</td><td class="text-right">${inviteBtnRaw.replace('<button', `<button data-user="${user.id}"`)}</td></tr>`;
            }));
            inviteListCardHtml = await card.renderCard({
                title: 'Invite List',
                extra: `<table class="list" data-height="300px"><thead><tr><th>Username</th><th></th></tr></thead><tbody>${renderedRows.join('\n')}</tbody></table>`
            });
        }

        const playerStatusCard = await new Card().renderCard({
            title: 'Match Setup',
            extra: `<div class="lobby-layout">
                <div class="invite-list-container hidden">${inviteListCardHtml}</div>
                <div class="matchup-view-container">
                    <div class="lobby-center text-center">
                        ${player1BtnHtml}<div class="vs my-2 font-bold text-lg">VS</div>${player2BtnHtml}
                    </div>
                    <div class="lobby-actions mt-4">${actionButtonsGroup}</div>
                </div>
            </div>`
        });

        const simNotice = `<div class="sim-notice text-sm text-yellow-500 font-mono mb-2"></div>`;

        return this.render(`
            <div class="container lobby-page-container">
                ${simNotice}
                ${titleSection}
                ${playerStatusCard}
            </div>
        `);
    }
}
