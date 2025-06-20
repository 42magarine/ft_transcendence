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
        if (window.lobbyListService && window.lobbyListService.getLobbies) {
            lobbies = await window.lobbyListService.getLobbies();
            lobbies = lobbies.filter(lobby => lobby.currentPlayers !== lobby.maxPlayers && !lobby.isStarted);
        }

        const lobbyListCard = await new Card().renderCard({
            title: window.ls.__('Available Lobbies'),
            contentBlocks: [
                {
                    type: 'buttongroup',
                    props: {
                        layout: 'group',
                        align: 'center',
                        buttons: [
                            {
                                id: 'createGameBtn',
                                text: window.ls.__('Create Game'),
                            },
                            {
                                id: 'createTournamentBtn',
                                text: window.ls.__('Create Tournament'),
                                color: 'blue'
                            }
                        ]
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
        window.lobbyListService?.setupCreateLobbyButtonListener();
        window.lobbyListService?.setupJoinLobbyButtonListener();
    }

    private cleanupEvents(): void {
        if (window.lobbyListService) {
            const createBtn = document.getElementById('createLobbyBtn');
            if (createBtn) {
                createBtn.removeEventListener('click', window.lobbyListService.handleCreateGameClick);
            }

            const createTournamentBtn = document.getElementById('createTournamentBtn');
            if (createTournamentBtn) {
                createTournamentBtn.removeEventListener('click', window.lobbyListService.handleCreateTournamentClick);
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
