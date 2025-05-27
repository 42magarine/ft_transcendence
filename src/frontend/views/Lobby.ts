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

    async getHtml(): Promise<string> {
        const title = new Title({ title: `Lobby ${this.lobbyId}` });
        const titleSection = await title.getHtml();
        const button = new Button();

        // let lobby: Lobby |null = null;
        // try {
        //     lobby = await window.lobbyListService.getLobby();
        // }
        // catch (error) {
        //     console.error("Lobby View: Error fetching Lobby:", error);
        // }

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

        const playerStatusCard = await new Card().renderCard({
            title: 'Match Setup',
            extra: `<div class="lobby-layout">
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
