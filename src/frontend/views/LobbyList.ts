import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Title from '../components/Title.js';
import { LobbyInfo } from '../../interfaces/interfaces.js';
import Button from '../components/Button.js';

export default class LobbyList extends AbstractView {
    private lobbyData: LobbyInfo[] = [];

    constructor(params: URLSearchParams) {
        super();
        this.params = params;
    }

    async getHtml(): Promise<string> {
        const title = new Title({ title: 'Available Lobbies' });

        const button = new Button();
        const createLobbyButton = await button.renderButton({
            id: 'createLobbyBtn',
            text: 'Create Lobby',
            type: 'button',
            className: 'btn btn-primary'
        });

        let lobbies: LobbyInfo[] = [];
        await window.socketReady;
        if (window.lobbyListService) {
            try {
                lobbies = await window.lobbyListService.getLobbies();
            } catch (error) {
                console.error("LobbyList View: Error fetching lobbies:", error);
                lobbies = [];
            }
        } else {
            console.warn("LobbyList View: lobbyListService not found. Cannot fetch lobbies.");
        }
        const card = new Card();
        const lobbyListCard = await card.renderCard({
            title: 'Lobby List',
            prefix: createLobbyButton,
            table: {
                id: 'lobby-list',
                height: '400px',
                data: lobbies,
                columns: [
                    { key: 'name', label: 'Lobby Name' },
                    { key: 'id', label: 'ID' },
                    { key: 'creatorId', label: 'Creator ID' },
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
                        buttons: (lobby) => [
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
        });
        

        return this.render(`
            <div class="container">
            ${lobbyListCard}
            </div>`
        );
    }
}
