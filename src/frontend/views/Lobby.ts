// Lobby.ts
import AbstractView from '../../utils/AbstractView.js';
import Title from '../components/Title.js';
import Button from '../components/Button.js';
import Card from '../components/Card.js';
import Router from '../../utils/Router.js';
import
{
	LobbyParticipant,
	LobbyDataWithParticipants,
	PlayerDisplayState
} from '../../interfaces/interfaces.js';

export default class Lobby extends AbstractView
{
    private lobbyId: string;

    private currentPlayerDisplay: PlayerDisplayState = { username: 'You', isJoined: false, isReady: false };
    private opponentPlayerDisplay: PlayerDisplayState = { username: 'Waiting...', isJoined: false, isReady: false };

    constructor(params: URLSearchParams)
    {
        super();
        this.lobbyId = params.get('id') || '';
        if (!this.lobbyId)
        {
            console.error("Lobby ID is missing!");
            Router.redirect('/lobbylist');
        }
        this.setTitle(`Lobby ${this.lobbyId}`);
    }

    async getHtml(): Promise<string>
    {
        const title = new Title({ title: `Lobby ${this.lobbyId}` });
        const titleSection = await title.getHtml();
        const button = new Button();

        const player1BtnHtml = await button.renderButton(
        {
            id: 'player1',
            text: this.currentPlayerDisplay.username || 'You',
            className: `btn ${this.currentPlayerDisplay.isReady ? 'btn-success' : (this.currentPlayerDisplay.isJoined ? 'btn-warning' : 'btn-neutral')}`,
            type: 'button'
        });

        const player2BtnHtml = await button.renderButton(
        {
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

        const actionButtonsGroup = await button.renderGroup(
        {
            layout: 'group',
            align: 'center',
            buttons:
            [
                startGameButtonDef,
                {
                    id: 'leaveBtn',
                    text: 'Leave Lobby',
                    className: 'btn btn-danger',
                    type: 'button',
                    href: '/lobbylist'
                }
            ]
        });

        const card = new Card();

        const playerStatusCard = await card.renderCard(
        {
            title: 'Match Setup',
            contentBlocks:
            [
                {
                    type: 'matchup',
                    props:
                    {
                        player1: player1BtnHtml,
                        player2: player2BtnHtml
                    }
                },
                {
                    type: 'actions',
                    props:
                    {
                        buttons: actionButtonsGroup
                    }
                }
            ]
        });
        
        return this.render(`
            <div class="container lobby-page-container">
                ${titleSection}
                ${playerStatusCard}
            </div>
        `);
    }
}
