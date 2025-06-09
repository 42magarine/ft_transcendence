import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Router from '../../utils/Router.js';
import { ILobbyState, IPlayerState } from '../../interfaces/interfaces.js';

export default class Lobby extends AbstractView {
    private lobbyId: string;
    private lobby!: ILobbyState;
    private players: IPlayerState[] = [];

    constructor(params: URLSearchParams) {
        super();

        this.initEvents = this.setupEvents.bind(this);

        this.lobbyId = params.get('id') || '';
        if (!this.lobbyId) {
            console.error("Lobby ID is missing!");
            Router.redirect('/lobbylist');
        }
        for (let i = 0; i < 2; i++) {
            this.players[i] = {
                userName: 'Waiting for Opponent...',
                playerNumber: i + 1,
                userId: i + 1,
                isReady: false
            };
        }
        this.setTitle(`Lobby ${this.lobbyId}`);
    }

    async getHtml(): Promise<string> {
        this.lobby = window.lobbyService!.getLobby();

        for (let i = 0; i < 2; i++) {
            this.players[i] = {
                userName: 'Waiting for Opponent...',
                playerNumber: i + 1,
                userId: i + 1,
                isReady: false
            };
        }
        if (this.lobby.lobbyPlayers) {
            for (let i = 0; i < this.lobby.lobbyPlayers.length && i < 8; i++) {
                this.players[i] = this.lobby.lobbyPlayers[i];
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
                                        text: this.players[0].userName,
                                        className:
                                            `btn ${this.players[0].isReady ? 'btn-green' : 'btn-yellow'}`
                                    }
                                },
                                player2:
                                {
                                    type: 'button',
                                    props:
                                    {
                                        id: 'player2',
                                        text: this.players[1].userName || "Waiting for Opponent...",
                                        className:
                                            `btn ${this.players[1].isReady ? 'btn-green' : 'btn-yellow'}`
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

    private setupEvents(): void {
        console.log('[LobbyView] setupEvents()');

        window.lobbyService?.setupEventListener();
    }

    private cleanupEvents(): void {
        console.log('[LobbyView] cleanupEvents()');

        if (window.lobbyService) {
            const startButton = document.getElementById('startGameBtn');
            if (startButton) {
                startButton.removeEventListener('click', window.lobbyService.handleStartGameClick);
            }

            const leaveButton = document.getElementById('leaveBtn');
            if (leaveButton) {
                leaveButton.removeEventListener('click', window.lobbyService.handleLeaveLobbyClick
                );
            }
        }
    }
}
