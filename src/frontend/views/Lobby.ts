import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import type { CardProps } from '../../interfaces/componentInterfaces.js';
import Router from '../../utils/Router.js';
import { ILobbyPlayer } from '../../interfaces/interfaces.js';


export default class Lobby extends AbstractView
{
    private lobbyId: string;

    private player1: ILobbyPlayer = { userName: 'You', playerNumber: 1, userId: 1, isJoined: false, isReady: false };
    private player2: ILobbyPlayer = { userName: 'Opponent', playerNumber: 2, userId: 2, isJoined: false, isReady: false };

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
                                text: this.player1.userName,
                                className:
                                    `btn ${this.player1.isReady ? 'btn-green'
                                    : (this.player1.isJoined ? 'btn-yellow' : 'btn-primary')}`
                            }
                        },
                        player2:
                        {
                            type: 'button',
                            props:
                            {
                                id: 'player2',
                                text: this.player2.isJoined
                                    ? (this.player2.userName || 'Opponent')
                                    : 'Waiting for Opponent...',
                                className:
                                    `btn ${this.player2.isReady ? 'btn-green'
                                    : (this.player2.isJoined ? 'btn-yellow' : 'btn-primary')}`
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
