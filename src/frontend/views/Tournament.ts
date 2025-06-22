import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Router from '../../utils/Router.js';
import { ILobbyState, IPlayerState } from '../../interfaces/interfaces.js';
import Modal from '../components/Modal.js'

export default class Tournament extends AbstractView {
    private lobbyId: string;
    private lobby!: ILobbyState;
    private players: IPlayerState[] = [];

    constructor(routeParams: Record<string, string>, queryParams: URLSearchParams = new URLSearchParams()) {
        super();

        this.initEvents = this.setupEvents.bind(this);

        this.lobbyId = routeParams['id'];
        this.lobbyId = routeParams['id'];
        if (!this.lobbyId) {
            new Modal().renderInfoModal({
                id: "missing-lobby-id",
                title: "Missing Lobby",
                message: "No lobby ID was found. You will be redirected to the lobby list."
            });
            Router.redirect('/lobbylist');
        }
        for (let i = 0; i < 8; i++) {
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
        this.lobby = window.tournamentService!.getLobby();

        for (let i = 0; i < 8; i++) {
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
                            type: 'buttongroup',
                            props:
                            {
                                layout: 'grid',
                                buttons:
                                    [
                                        {
                                            id: 'player1',
                                            text: this.players[0].userName,
                                            className:
                                                `btn ${this.players[0].isReady ? 'btn-green' : 'btn-yellow'}`
                                        },
                                        {
                                            id: 'player2',
                                            text: this.players[1].userName || "Waiting for Opponent...",
                                            className:
                                                `btn ${this.players[1].isReady ? 'btn-green' : 'btn-yellow'}`
                                        },
                                        {
                                            id: 'player3',
                                            text: this.players[2].userName || "Waiting for Opponent...",
                                            className:
                                                `btn ${this.players[2].isReady ? 'btn-green' : 'btn-yellow'}`
                                        },
                                        {
                                            id: 'player4',
                                            text: this.players[3].userName || "Waiting for Opponent...",
                                            className:
                                                `btn ${this.players[3].isReady ? 'btn-green' : 'btn-yellow'}`
                                        },
                                        {
                                            id: 'player5',
                                            text: this.players[4].userName || "Waiting for Opponent...",
                                            className:
                                                `btn ${this.players[4].isReady ? 'btn-green' : 'btn-yellow'}`
                                        },
                                        {
                                            id: 'player6',
                                            text: this.players[5].userName || "Waiting for Opponent...",
                                            className:
                                                `btn ${this.players[5].isReady ? 'btn-green' : 'btn-yellow'}`
                                        },
                                        {
                                            id: 'player7',
                                            text: this.players[6].userName || "Waiting for Opponent...",
                                            className:
                                                `btn ${this.players[6].isReady ? 'btn-green' : 'btn-yellow'}`
                                        },
                                        {
                                            id: 'player8',
                                            text: this.players[7].userName || "Waiting for Opponent...",
                                            className:
                                                `btn ${this.players[7].isReady ? 'btn-green' : 'btn-yellow'}`
                                        },
                                    ],
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
        window.tournamentService?.setupEventListener();
    }
}
