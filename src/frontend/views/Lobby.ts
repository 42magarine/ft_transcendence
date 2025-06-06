// Lobby.ts - Fixed version with correct service reference
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

        // Bind event handlers
        this.initEvents = this.setupEvents.bind(this);
        this.destroyEvents = this.cleanupEvents.bind(this);
    }

    async getHtml(): Promise<string> {
        // Check if lobbyService exists and has the getLobby method
        if (window.lobbyService && typeof window.lobbyService.getLobby === 'function') {
            this.lobby = window.lobbyService.getLobby();
        } else {
            console.warn('[Lobby View] lobbyService not available or getLobby method missing');
            // Initialize with default lobby state if service not available
            this.lobby = {
                lobbyId: this.lobbyId,
                name: `Lobby ${this.lobbyId}`,
                creatorId: 0,
                maxPlayers: 2,
                currentPlayers: 0,
                createdAt: new Date(),
                lobbyType: 'game' as const,
                isStarted: false,
                lobbyPlayers: []
            };
        }

        // Initialize default players
        this.player1 = { userName: 'Waiting for Player...', playerNumber: 1, userId: 0, isReady: false };
        this.player2 = { userName: 'Waiting for Player...', playerNumber: 2, userId: 0, isReady: false };

        // Update players from lobby data if available
        if (this.lobby && this.lobby.lobbyPlayers && this.lobby.lobbyPlayers.length > 0) {
            // Sort players by playerNumber to ensure correct positioning
            const sortedPlayers = this.lobby.lobbyPlayers.sort((a, b) => a.playerNumber - b.playerNumber);

            // Assign players to slots based on their playerNumber
            sortedPlayers.forEach(player => {
                if (player.playerNumber === 1) {
                    this.player1 = player;
                } else if (player.playerNumber === 2) {
                    this.player2 = player;
                }
            });
        }

        // Determine current user's ready state for button text
        const currentUser = window.currentUser;
        let currentPlayerReady = false;
        let readyButtonText = 'Click when Ready';
        let isCurrentUserInLobby = false;

        if (currentUser) {
            const currentPlayerInLobby = this.lobby.lobbyPlayers?.find(p => p.userId === currentUser.id);
            if (currentPlayerInLobby) {
                isCurrentUserInLobby = true;
                currentPlayerReady = currentPlayerInLobby.isReady;
                readyButtonText = currentPlayerReady ? 'Cancel Ready' : 'Click when Ready';
            }
        }

        const lobbyCard = await new Card().renderCard(
            {
                title: `Lobby ${this.lobbyId} (${this.lobby.currentPlayers}/${this.lobby.maxPlayers})`,
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
                                        className: `btn ${this.player1.isReady ? 'btn-green' : (this.player1.userId > 0 ? 'btn-yellow' : 'btn-gray')}`
                                    }
                                },
                                player2:
                                {
                                    type: 'button',
                                    props:
                                    {
                                        id: 'player2',
                                        text: this.player2.userName,
                                        className: `btn ${this.player2.isReady ? 'btn-green' : (this.player2.userId > 0 ? 'btn-yellow' : 'btn-gray')}`
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
                                            text: readyButtonText,
                                            className: `btn ${currentPlayerReady ? 'btn-warning' : 'btn-primary'} ${!isCurrentUserInLobby ? 'disabled' : ''}`,
                                            type: 'button'
                                        },
                                        {
                                            id: 'leaveBtn',
                                            text: 'Leave Lobby',
                                            type: 'button',
                                            className: 'btn btn-secondary'
                                        }
                                    ],
                            }
                        }
                    ]
            });
        return this.render(`${lobbyCard}`);
    }

    // Initialize event listeners when view loads
    private setupEvents(): void {
        console.log('[Lobby View] Initializing events');
        if (window.lobbyService && typeof window.lobbyService.handleLobbyPageClick === 'function') {
            document.body.addEventListener('click', window.lobbyService.handleLobbyPageClick);
        } else {
            console.warn('[Lobby View] lobbyService not available for event handling');
        }
    }

    // Clean up event listeners when view unloads
    private cleanupEvents(): void {
        console.log('[Lobby View] Destroying events');
        if (window.lobbyService && typeof window.lobbyService.handleLobbyPageClick === 'function') {
            document.body.removeEventListener('click', window.lobbyService.handleLobbyPageClick);
        }
    }
}