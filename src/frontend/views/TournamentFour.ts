import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Router from '../../utils/Router.js';
import { ILobbyState, IPlayerState } from '../../interfaces/interfaces.js';

export default class Lobby extends AbstractView {
    private lobbyId: string;
    private lobby!: ILobbyState;
    private player1: IPlayerState;
    private player2: IPlayerState;
    private player3: IPlayerState;
    private player4: IPlayerState;
    private player5: IPlayerState;
    private player6: IPlayerState;
    private player7: IPlayerState;
    private player8: IPlayerState;

    constructor(params: URLSearchParams) {
        super();

        this.initEvents = this.setupEvents.bind(this);

        this.lobbyId = params.get('id') || '';
        if (!this.lobbyId) {
            console.error("Lobby ID is missing!");
            Router.redirect('/lobbylist');
        }
        this.player1 = { userName: 'Waiting for Opponent...', playerNumber: 1, userId: 1, isReady: false };
        this.player2 = { userName: 'Waiting for Opponent...', playerNumber: 2, userId: 2, isReady: false };
        this.player3 = { userName: 'Waiting for Opponent...', playerNumber: 3, userId: 3, isReady: false };
        this.player4 = { userName: 'Waiting for Opponent...', playerNumber: 4, userId: 4, isReady: false };
        this.player5 = { userName: 'Waiting for Opponent...', playerNumber: 5, userId: 5, isReady: false };
        this.player6 = { userName: 'Waiting for Opponent...', playerNumber: 6, userId: 6, isReady: false };
        this.player7 = { userName: 'Waiting for Opponent...', playerNumber: 7, userId: 7, isReady: false };
        this.player8 = { userName: 'Waiting for Opponent...', playerNumber: 8, userId: 8, isReady: false };
        this.setTitle(`Lobby ${this.lobbyId}`);
    }

    async getHtml(): Promise<string> {
        this.lobby = window.lobbyService!.getLobby();
        if (this.lobby.lobbyPlayers) {
            this.player1 = { userName: 'Waiting for Opponent...', playerNumber: 1, userId: 1, isReady: false };
            this.player2 = { userName: 'Waiting for Opponent...', playerNumber: 2, userId: 2, isReady: false };
            this.player3 = { userName: 'Waiting for Opponent...', playerNumber: 3, userId: 3, isReady: false };
            this.player4 = { userName: 'Waiting for Opponent...', playerNumber: 4, userId: 4, isReady: false };
            this.player5 = { userName: 'Waiting for Opponent...', playerNumber: 5, userId: 5, isReady: false };
            this.player6 = { userName: 'Waiting for Opponent...', playerNumber: 6, userId: 6, isReady: false };
            this.player7 = { userName: 'Waiting for Opponent...', playerNumber: 7, userId: 7, isReady: false };
            this.player8 = { userName: 'Waiting for Opponent...', playerNumber: 8, userId: 8, isReady: false };
            if (this.lobby.lobbyPlayers[0]) {
                this.player1 = this.lobby.lobbyPlayers[0];
            }
            if (this.lobby.lobbyPlayers[1]) {
                this.player2 = this.lobby.lobbyPlayers[1];
            }
            if (this.lobby.lobbyPlayers[2]) {
                this.player3 = this.lobby.lobbyPlayers[2];
            }
            if (this.lobby.lobbyPlayers[3]) {
                this.player4 = this.lobby.lobbyPlayers[3];
            }
            if (this.lobby.lobbyPlayers[4]) {
                this.player1 = this.lobby.lobbyPlayers[4];
            }
            if (this.lobby.lobbyPlayers[5]) {
                this.player2 = this.lobby.lobbyPlayers[5];
            }
            if (this.lobby.lobbyPlayers[6]) {
                this.player3 = this.lobby.lobbyPlayers[6];
            }
            if (this.lobby.lobbyPlayers[7]) {
                this.player4 = this.lobby.lobbyPlayers[7];
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
                                },
                                // player3:
                                // {
                                //     type: 'button',
                                //     props:
                                //     {
                                //         id: 'player3',
                                //         text: this.player3.userName || "Waiting for Opponent...",
                                //         className:
                                //             `btn ${this.player3.isReady ? 'btn-green' : 'btn-yellow'}`
                                //     }
                                // },
                                // player4:
                                // {
                                //     type: 'button',
                                //     props:
                                //     {
                                //         id: 'player4',
                                //         text: this.player4.userName || "Waiting for Opponent...",
                                //         className:
                                //             `btn ${this.player4.isReady ? 'btn-green' : 'btn-yellow'}`
                                //     }
                                // },
                                // player5:
                                // {
                                //     type: 'button',
                                //     props:
                                //     {
                                //         id: 'player5',
                                //         text: this.player5.userName || "Waiting for Opponent...",
                                //         className:
                                //             `btn ${this.player5.isReady ? 'btn-green' : 'btn-yellow'}`
                                //     }
                                // },
                                // player6:
                                // {
                                //     type: 'button',
                                //     props:
                                //     {
                                //         id: 'player6',
                                //         text: this.player5.userName || "Waiting for Opponent...",
                                //         className:
                                //             `btn ${this.player5.isReady ? 'btn-green' : 'btn-yellow'}`
                                //     }
                                // },
                                // player7:
                                // {
                                //     type: 'button',
                                //     props:
                                //     {
                                //         id: 'player7',
                                //         text: this.player7.userName || "Waiting for Opponent...",
                                //         className:
                                //             `btn ${this.player7.isReady ? 'btn-green' : 'btn-yellow'}`
                                //     }
                                // },
                                // player8:
                                // {
                                //     type: 'button',
                                //     props:
                                //     {
                                //         id: 'player8',
                                //         text: this.player8.userName || "Waiting for Opponent...",
                                //         className:
                                //             `btn ${this.player8.isReady ? 'btn-green' : 'btn-yellow'}`
                                //     }
                                // }
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
