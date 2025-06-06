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
            lobbies = lobbies.filter(lobby => lobby.currentPlayers !== lobby.maxPlayers);
        }

        const lobbyListCard = await new Card().renderCard({
            title: 'Available Lobbies',
            contentBlocks: [
                {
                    type: 'button',
                    props: {
                        id: 'createLobbyBtn',
                        text: 'Create Lobby',
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
                            { key: 'creatorId', label: 'Creator' },
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
                                    text: `${lobby.creatorId}`
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

        // if (!window.ft_socket) {
        //     console.warn('[LobbyList] Socket not ready');
        //     return;
        // }

        if (window.lobbyListService?.setupCreateLobbyButtonListener) {
            window.lobbyListService.setupCreateLobbyButtonListener();
        }

        if (window.lobbyListService?.setupJoinLobbyButtonListener) {
            window.lobbyListService.setupJoinLobbyButtonListener();
        }
    }

    private cleanupEvents(): void {
        console.log('[LobbyList] cleanupEvents()');

        // if (window.ft_socket && window.lobbyListService?.handleSocketMessage) {
        //     window.ft_socket.removeEventListener('message', window.lobbyListService.handleSocketMessage);
        // }

        if (window.lobbyListService) {
            document.body.removeEventListener('click', window.lobbyListService.handleCreateLobbyClick);
            document.body.removeEventListener('click', window.lobbyListService.handleJoinLobbyClick);
        }
    }
}
