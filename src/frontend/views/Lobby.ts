import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Router from '../../utils/Router.js';
import { ILobbyState, IPlayerState } from '../../interfaces/interfaces.js';

export default class Lobby extends AbstractView {
    private lobbyId: string;
    private lobby!: ILobbyState;
    private player1: IPlayerState;
    private player2: IPlayerState;

    constructor(params: URLSearchParams) {
        super();
        this.lobbyId = params.get('id') || '';
        if (!this.lobbyId) {
            console.error("Lobby ID is missing!");
            Router.redirect('/lobbylist');
        }
        this.player1 = { userName: 'Waiting for Opponent...', playerNumber: 1, userId: 1, isReady: false };
        this.player2 = { userName: 'Waiting for Opponent...', playerNumber: 2, userId: 2, isReady: false };

        this.setTitle(`Lobby ${this.lobbyId}`);
    }

    async getHtml(): Promise<string> {
        this.lobby = window.lobbyService!.getLobby();
        if (this.lobby.lobbyPlayers) {
            this.player1 = { userName: 'Waiting for Opponent...', playerNumber: 1, userId: 1, isReady: false };
            this.player2 = { userName: 'Waiting for Opponent...', playerNumber: 2, userId: 2, isReady: false };
            if (this.lobby.lobbyPlayers[0]) {
                this.player1 = this.lobby.lobbyPlayers[0];
            }
            if (this.lobby.lobbyPlayers[1]) {
                this.player2 = this.lobby.lobbyPlayers[1];
            }
        }

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
                                            `btn ${this.player1.isReady ? 'btn-green' : 'btn-yellow'}`
                                    }
                                },
                                player2:
                                {
                                    type: 'button',
                                    props:
                                    {
                                        id: 'player2',
                                        text: this.player2.userName || "Waiting for Opponent...",
                                        className:
                                            `btn ${this.player2.isReady ? 'btn-green' : 'btn-yellow'}`
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
    // public static initEvents(): void {
    //     console.log('[LobbyView] init');
    //     document.body.addEventListener('click', window.lobbyService.handleLobbyPageClick);
    // }

    // public static destroyEvents(): void {
    //     console.log('[LobbyView] destroy');
    //     if (window.ft_socket) {
    //         window.ft_socket.removeEventListener('message', window.lobbyService.handleSocketMessage);
    //     }
    //     document.body.removeEventListener('click', window.lobbyService.handleLobbyPageClick);
    // }
}
