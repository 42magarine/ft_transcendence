import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import { ILobbyState } from '../../interfaces/interfaces.js';

export default class LobbyList extends AbstractView {
    constructor() {
        super();

        this.initEvents = this.setupEvents.bind(this);
        this.destroyEvents = this.cleanupEvents.bind(this);
    }

    async getHtml(): Promise<string> {
        let lobbies: ILobbyState[] = [];
        lobbies = await window.lobbyListService.getLobbies();

        lobbies = lobbies.filter(
            (lobby) => lobby.currentPlayers !== lobby.maxPlayers && !lobby.isStarted
        );

        const lobbyListCard = await new Card().renderCard({
            title: window.ls.__('Available Lobbies'),
            contentBlocks: [
                {
                    type: 'button',
                    props: {
                        id: 'createGameBtn',
                        text: 'Create Game',
                        type: 'button',
                        className: 'btn btn-primary'
                    },
                },
                {
                    type: 'button',
                    props: {
                        id: 'createTournamentBtn4',
                        text: 'Tournament (4 Players)',
                        type: 'button',
                        className: 'btn btn-primary'
                    },
                },
                {
                    type: 'button',
                    props: {
                        id: 'createTournamentBtn8',
                        text: 'Tournament (8 Players)',
                        type: 'button',
                        className: 'btn btn-primary'
                    }
                },
                {
                    type: 'table',
                    props: {
                        id: 'lobby-list',
                        title: window.ls.__('Lobby List'),
                        height: '400px',
                        data: lobbies,
                        columns: [
                            { key: 'id', label: window.ls.__('ID') },
                            { key: 'creatorId', label: window.ls.__('Creator') },
                            { key: 'players', label: window.ls.__('Players') },
                            { key: 'status', label: window.ls.__('Status') },
                            { key: 'actions', label: window.ls.__('Actions') }
                        ],
                        rowLayout: (lobby) => [
                            {
                                type: 'label',
                                props: {
                                    htmlFor: '',
                                    text: `${lobby.lobbyId}`
                                }
                            },
                            {
                                type: 'label',
                                props: {
                                    htmlFor: '',
                                    text: `${lobby.lobbyType}`
                                }
                            },
                            {
                                type: 'stat',
                                props: {
                                    label: '',
                                    value: `${lobby.currentPlayers} / ${lobby.maxPlayers}`
                                }
                            },
                            {
                                type: 'stat',
                                props: {
                                    label: '',
                                    value: lobby.isStarted ? window.ls.__('Started') : window.ls.__('Waiting')
                                }
                            },
                            {
                                type: 'button',
                                props: {
                                    text: window.ls.__('Join Lobby'),
                                    className:
                                        'joinLobbyBtn btn btn-primary ' +
                                        (lobby.currentPlayers == lobby.maxPlayers ? 'disabled' : ''),
                                    dataAttributes: {
                                        'lobby-id': lobby.lobbyId
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        });

        return this.render(`${lobbyListCard}`);
    }

    private setupEvents(): void {
        console.log('[LobbyList] setupEvents()');

        window.lobbyListService?.setupCreateLobbyButtonListener();
        window.lobbyListService?.setupJoinLobbyButtonListener();
    }

    private cleanupEvents(): void {
        console.log('[LobbyList] cleanupEvents()');

        if (window.lobbyListService) {
            const createButton = document.getElementById('createLobbyBtn');
            if (createButton) {
                createButton.removeEventListener('click', window.lobbyListService.handleCreateGameClick);
            }

            const createTournamentButton4 = document.getElementById('createTournamentBtn4');
            if (createTournamentButton4) {
                createTournamentButton4.removeEventListener('click', window.lobbyListService.handleCreateTournamentClick4);
            }

            const createTournamentButton8 = document.getElementById('createTournamentBtn8');
            if (createTournamentButton8) {
                createTournamentButton8.removeEventListener('click', window.lobbyListService.handleCreateTournamentClick4);
            }

            const joinButtons = document.querySelectorAll('.joinLobbyBtn');
            joinButtons.forEach((btn: Element) => {
                btn.removeEventListener(
                    'click',
                    window.lobbyListService.handleJoinLobbyClick
                );
            });
        }
    }
}
