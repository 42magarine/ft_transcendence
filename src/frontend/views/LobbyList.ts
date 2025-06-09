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
        if (window.lobbyListService && window.lobbyListService.getLobbyList) {
            lobbies = window.lobbyListService.getLobbyList();
            lobbies = lobbies.filter(lobby => lobby.currentPlayers !== lobby.maxPlayers);
        }

        const lobbyListCard = await new Card().renderCard({
            title: 'Available Lobbies',
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
                        id: 'createTournamentBtn',
                        text: 'Create Tournament',
                        type: 'button',
                        className: 'btn btn-primary'
                    },
                },
                {
                    type: 'table',
                    props: {
                        id: 'lobby-list',
                        title: 'Lobby List',
                        height: '400px',
                        data: lobbies,
                        columns: [
                            { key: 'id', label: 'ID' },
                            { key: 'type', label: 'Type' },
                            { key: 'players', label: 'Players' },
                            { key: 'status', label: 'Status' },
                            { key: 'actions', label: 'Actions' }
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
                                    value: lobby.isStarted ? 'Started' : 'Waiting'
                                }
                            },
                            {
                                type: 'button',
                                props:
                                {
                                    text: 'Join Lobby',
                                    className: 'joinLobbyBtn btn btn-primary ' + ((lobby.currentPlayers == lobby.maxPlayers) ? "disabled" : ""),
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
                btn.removeEventListener('click', window.lobbyListService.handleJoinLobbyClick);
            });
        }
    }
}
