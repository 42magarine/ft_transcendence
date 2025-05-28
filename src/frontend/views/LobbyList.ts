import AbstractView from '../../utils/AbstractView.js';
import Button from '../components/Button.js';
import Card from '../components/Card.js';
import Title from '../components/Title.js';
import { LobbyInfo } from '../../interfaces/interfaces.js';

export default class LobbyList extends AbstractView
{
    constructor()
    {
        super();
    }

    async getHtml(): Promise<string>
    {
        let lobbies: LobbyInfo[] = [];
        lobbies = await window.lobbyListService.getLobbies();

        const title = new Title({ title: 'Available Lobbies' });

        const card = new Card();
        const lobbyListCard = await card.renderCard(
        {
            title: 'title',
            contentBlocks:
            [
                {
                    button:
                    {
                        id: 'createLobbyBtn',
                        text: 'Create Lobby',
                        type: 'button',
                        className: 'btn btn-primary'
                    },
                },
                {
                    table: {
                        id: 'lobby-list',
                        height: '400px',
                        data: lobbies,
                        columns:
                        [
                            {
                                key: 'name',
                                label: 'Lobby Name'
                            },
                            {
                                key: 'id',
                                label: 'ID'
                            },
                            {
                                key:
                                'creatorId',
                                label: 'Creator ID'
                            },
                            {
                                key: 'players',
                                label: 'Players',
                                render: (lobby) => `${lobby.currentPlayers} / ${lobby.maxPlayers}`
                            },
                            {
                                key: 'status',
                                label: 'Status',
                                render: (lobby: { isStarted: boolean }) => lobby.isStarted ? 'Started' : 'Waiting'
                            },
                            {
                                key: 'actions',
                                label: 'Action',
                                isAction: true,
                                buttons: (lobby) =>
                                [
                                    {
                                        id: `accept-${lobby.id}`,
                                        text: 'Accept Invite',
                                        className: 'btn btn-accent accept-invite-btn',
                                        href: `/lobby/${lobby.id}`,
                                        onClick: `handleAcceptInvite(${lobby.id}, ${lobby.creatorId})`
                                    },
                                    {
                                        id: `join-${lobby.id}`,
                                        text: 'Join Lobby',
                                        className: 'btn btn-primary',
                                        href: `/lobby/${lobby.id}`
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        });

        return this.render(` ${lobbyListCard}`);
    }
}
