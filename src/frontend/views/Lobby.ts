import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import type { CardProps } from '../../interfaces/componentInterfaces.js';
import Router from '../../utils/Router.js';
import {
    LobbyParticipant,
    LobbyDataWithParticipants,
    PlayerDisplayState
} from '../../interfaces/interfaces.js';

export default class Lobby extends AbstractView
{
    private lobbyId: string;

    private currentPlayerDisplay: PlayerDisplayState = { username: 'You', isJoined: false, isReady: false };
    private opponentPlayerDisplay: PlayerDisplayState = { username: 'Opponent', isJoined: false, isReady: false };

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
    
        const lobbyCard = await new Card().renderCard(
        {
            title: `Lobby ${this.lobbyId}`,
            contentBlocks:
            [
                {
                    type: 'separator',
                },
                // Matchup buttons
                {
                    type: 'matchup',
                    props:
                    {
                        player1:
                        {
                            type: 'button',
                            props:
                            {
                                id: 'player1',
                                text: this.currentPlayerDisplay.username,
                                className:
                                    `btn ${this.currentPlayerDisplay.isReady ? 'btn-green'
                                    : (this.currentPlayerDisplay.isJoined ? 'btn-yellow' : 'btn-primary')}`
                            }
                        },
                        player2:
                        {
                            type: 'button',
                            props:
                            {
                                id: 'player2',
                                text: this.opponentPlayerDisplay.isJoined
                                    ? (this.opponentPlayerDisplay.username || 'Opponent')
                                    : 'Waiting for Opponent...',
                                className:
                                    `btn ${this.opponentPlayerDisplay.isReady ? 'btn-green'
                                    : (this.opponentPlayerDisplay.isJoined ? 'btn-yellow' : 'btn-primary')}`
                            }
                        }
                    }
                },
                {
                    type: 'separator',
                },
                // Action buttons
                {
                    type: 'buttongroup',
                    props:
                    {
                        buttons:
                        [
                            {
                                id: 'startGameBtn',
                                text: 'Click when Ready',
                                className: 'btn btn-primary',
                                type: 'button'
                            },
                            {
                                id: 'leaveBtn',
                                text: 'Leave Lobby',
                                type: 'button',
                                href: '/lobbylist'
                            }
                        ],
                    }
                }
            ]
        });
        return this.render(`${lobbyCard}`);
    }
}
