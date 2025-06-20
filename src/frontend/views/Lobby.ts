import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Router from '../../utils/Router.js';
import { ILobbyState, IPlayerState } from '../../interfaces/interfaces.js';
import __ from '../services/LanguageService.js';

export default class Lobby extends AbstractView {
    private lobbyId: string;
    private lobby!: ILobbyState;
    private players: IPlayerState[] = [];

    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);

        this.initEvents = this.setupEvents.bind(this);

        this.lobbyId = routeParams.id || '';
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
                                        text: window.ls.__(this.players[0].userName),
                                        className: `btn state-btn ${this.players[0].isReady ? 'btn-green' : 'btn-yellow'}`
                                    }
                                },
                                player2:
                                {
                                    type: 'button',
                                    props:
                                    {
                                        id: 'player2',
                                        text: window.ls.__(this.players[1].userName),
                                        className:
                                            `btn state-btn ${this.players[1].isReady ? 'btn-green' : 'btn-yellow'}`
                                    }
                                }
                            }
                        },
                        {
                            type: 'separator',
                        },
                        {
                            type: 'buttongroup',
                            props:
                            {
                                buttons:
                                    [
                                        {
                                            id: 'startGameBtn',
                                            text: window.ls.__('Click when Ready'),
                                            className: 'btn btn-primary',
                                            type: 'button'
                                        },
                                        {
                                            id: 'leaveBtn',
                                            text: window.ls.__('Leave Lobby'),
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
        window.lobbyService?.setupEventListener();
    }

    private cleanupEvents(): void {
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
