// Lobby.ts
import AbstractView from '../../utils/AbstractView.js';
import Title from '../components/Title.js';
import Button from '../components/Button.js';
import Card from '../components/Card.js';
import GameService from '../services/GameService.js';
import UserService from '../services/UserService.js';
import Router from '../../utils/Router.js';
import {
    LobbyInfo as LobbyInfoFromServer,
    User
} from '../../interfaces/interfaces.js';

import { LobbyParticipant, LobbyDataWithParticipants } from '../../interfaces/interfaces.js';


import {
    LOBBY_DETAILS_UPDATED_EVENT,
    LOBBY_PLAYER_JOINED_EVENT,
    LOBBY_GAME_STARTED_EVENT,
    LOBBY_INVITE_SENT_EVENT
} from '../services/LobbyService.js';


interface PlayerDisplayState extends Partial<LobbyParticipant> {
    isCreator?: boolean;
    isJoined?: boolean;
}

export default class Lobby extends AbstractView {
    private currentUser: User | null = null;
    private lobbyId: string;
    private usersForInviteList: User[] = [];


    private currentLobbyFullData: LobbyDataWithParticipants | null = null;
    private currentPlayerDisplay: PlayerDisplayState = { username: 'You', isJoined: false, isReady: false };
    private opponentPlayerDisplay: PlayerDisplayState = { username: 'Waiting...', isJoined: false, isReady: false };


    private lastInvitedUserSim: User | null = null;


    constructor(params: URLSearchParams) {
        super();
        this.lobbyId = params.get('id') || '';
        if (!this.lobbyId) {
            console.error("Lobby ID is missing!");
            Router.redirect('/lobbylist');
        }
        this.setTitle(`Lobby ${this.lobbyId}`);
    }

    private async initialFetchAndSetup() {
        this.currentUser = await UserService.getCurrentUser();
        if (!this.currentUser) {
            console.error("Lobby: Current user not found. Redirecting.");
            Router.redirect('/login');
            return;
        }
        try {
            const res = await fetch(`/api/lobbies/${this.lobbyId}`);
            if (res.ok) {
                const initialLobbyData = await res.json();
                if (initialLobbyData.participants) {
                    this.processLobbyDataUpdate({ ...initialLobbyData, id: this.lobbyId });
                }
            } else {
                console.warn('Lobby.ts: Failed to fetch initial lobby data via HTTP:', res.status);
                if (res.status === 404) {
                    console.error(`Lobby ${this.lobbyId} not found.`);
                    Router.redirect('/lobbylist');
                    return;
                }
            }
        } catch (err) {
            console.error('Lobby.ts: Error fetching initial lobby data:', err);
        }

        if (this.currentUser) {
            try {
                const res = await fetch('/api/users/');
                if (res.ok) {
                    this.usersForInviteList = (await res.json() as User[])
                        .filter(u => u.id !== this.currentUser?.id);
                }
            } catch (err) {
                console.error('Lobby.ts: Failed to fetch user list for invites:', err);
            }
        }
    }

    private processLobbyDataUpdate(lobbyDataWithParticipants: LobbyDataWithParticipants | null) {
        if (!this.currentUser) {
            console.warn("Lobby.ts: processLobbyDataUpdate called without current user.");
            return;
        }
        this.currentLobbyFullData = lobbyDataWithParticipants;

        if (!lobbyDataWithParticipants || !lobbyDataWithParticipants.participants) {
            console.warn('[Lobby.ts] Lobby data or participants list is missing. UI may be incomplete.');

            this.currentPlayerDisplay = {
                id: this.currentUser.id,
                username: this.currentUser.username,
                isReady: false,
                isCreator: lobbyDataWithParticipants?.creatorId === this.currentUser.id,
            };
            this.opponentPlayerDisplay = { username: 'Waiting for Opponent', isJoined: false, isReady: false };
        } else {
            const { participants, creatorId } = lobbyDataWithParticipants;
            const currentUserInLobby = participants.find(p => p.id === this.currentUser!.id);
            const opponentInLobby = participants.find(p => p.id !== this.currentUser!.id);

            if (currentUserInLobby) {
                this.currentPlayerDisplay = {
                    ...currentUserInLobby,
                    isJoined: true,
                    isCreator: creatorId === currentUserInLobby.id,
                };
            } else {
                this.currentPlayerDisplay = {
                    id: this.currentUser.id,
                    username: this.currentUser.username,
                    isJoined: false,
                    isReady: false,
                    isCreator: creatorId === this.currentUser.id,
                };
            }

            if (opponentInLobby) {
                this.opponentPlayerDisplay = {
                    ...opponentInLobby,
                    isJoined: true,
                    isCreator: creatorId === opponentInLobby.id,
                };
            } else {
                this.opponentPlayerDisplay = { username: 'Waiting for Opponent', isJoined: false, isReady: false };
            }
        }

        this.refreshAllUIComponents();
    }

    private refreshAllUIComponents() {
        this.updatePlayerButtonsUI();
        this.updateStartButtonUI();
        this.toggleInviteListAndMatchupVisibility();
        this.updateDebugCard();
        this.updateSimNotice();
    }


    private updatePlayerButtonsUI() {
        const player1Btn = document.getElementById('player1') as HTMLButtonElement;
        const player2Btn = document.getElementById('player2') as HTMLButtonElement;

        if (player1Btn) {
            player1Btn.textContent = `${this.currentPlayerDisplay.username || 'You'} ${this.currentPlayerDisplay.isReady ? '(Ready)' : ''}`;
            player1Btn.className = `btn ${this.currentPlayerDisplay.isReady ? 'btn-success' : (this.currentPlayerDisplay.isJoined ? 'btn-warning' : 'btn-neutral')}`;
        }
        if (player2Btn) {
            if (this.opponentPlayerDisplay.isJoined) {
                player2Btn.textContent = `${this.opponentPlayerDisplay.username || 'Opponent'} ${this.opponentPlayerDisplay.isReady ? '(Ready)' : ''}`;
                player2Btn.className = `btn ${this.opponentPlayerDisplay.isReady ? 'btn-success' : (this.opponentPlayerDisplay.isJoined ? 'btn-warning' : 'btn-neutral')}`;
            } else {
                player2Btn.textContent = "Waiting for Opponent...";
                player2Btn.className = 'btn btn-neutral';
            }
        }
    }

    private updateStartButtonUI() {
        const startGameBtn = document.getElementById('startGameBtn') as HTMLButtonElement | null;
        if (!startGameBtn || !this.currentLobbyFullData) {
            if (startGameBtn) startGameBtn.disabled = true;
            return;
        }

        const { participants } = this.currentLobbyFullData;
        const numParticipants = participants?.length || 0;
        const maxPlayers = this.currentLobbyFullData.maxPlayers || 2;


        const canStartCondition = numParticipants === maxPlayers;

        startGameBtn.disabled = false;

        if (!canStartCondition) {
            startGameBtn.textContent = `Waiting for ${maxPlayers - numParticipants} more player(s)`;
            startGameBtn.className = 'btn btn-secondary cursor-not-allowed opacity-60';
            startGameBtn.disabled = true;
        } else if (this.currentPlayerDisplay.isReady && this.opponentPlayerDisplay.isReady) {
            startGameBtn.textContent = 'Starting Game...';
            startGameBtn.className = 'btn btn-success';
            startGameBtn.disabled = true;
        } else if (this.currentPlayerDisplay.isReady) {
            startGameBtn.textContent = 'Waiting for Opponent...';
            startGameBtn.className = 'btn btn-warning';
            // Keep enabled if you allow "un-readying", otherwise disable
            // startGameBtn.disabled = true;
        } else {
            startGameBtn.textContent = 'Click when Ready';
            startGameBtn.className = 'btn btn-primary';
        }
    }

    private toggleInviteListAndMatchupVisibility() {
        const inviteListElement = document.querySelector('.invite-list-container');
        const matchupViewElement = document.querySelector('.matchup-view-container');

        const lobbyNotFull = this.currentLobbyFullData ? (this.currentLobbyFullData.participants?.length || 0) < this.currentLobbyFullData.maxPlayers : true;
        const showInviteList = !this.opponentPlayerDisplay.isJoined && this.currentPlayerDisplay.isCreator && lobbyNotFull;

        if (showInviteList) {
            inviteListElement?.classList.remove('hidden');
            matchupViewElement?.classList.add('hidden');
        } else {
            inviteListElement?.classList.add('hidden');
            matchupViewElement?.classList.remove('hidden');
        }
    }

    private updateDebugCard(): void {
        const debugDiv = document.getElementById('debug-info');
        if (!debugDiv) return;
        debugDiv.innerHTML = `
            <div class="w-1/2">
                <h3>You (${this.currentPlayerDisplay.isCreator ? 'Creator' : 'Joiner'}) [Joined: ${this.currentPlayerDisplay.isJoined}, Ready: ${this.currentPlayerDisplay.isReady}]</h3>
                <pre>${JSON.stringify(this.currentPlayerDisplay, null, 2)}</pre>
            </div>
            <div class="w-1/2">
                <h3>Opponent (${this.opponentPlayerDisplay.isCreator ? 'Creator' : 'Joiner'}) [Joined: ${this.opponentPlayerDisplay.isJoined}, Ready: ${this.opponentPlayerDisplay.isReady}]</h3>
                <pre>${JSON.stringify(this.opponentPlayerDisplay, null, 2)}</pre>
            </div>
            <div class="w-full mt-2">
                <h3>Full Lobby Data from Service:</h3>
                <pre>${JSON.stringify(this.currentLobbyFullData, null, 2)}</pre>
            </div>
        `;
    }

    private updateSimNotice(): void {
        const simNoticeDiv = document.querySelector('.sim-notice') as HTMLDivElement;
        if (simNoticeDiv && this.currentUser) {
            const mode = this.currentLobbyFullData?.creatorId === this.currentUser.id ? 'Creator' : 'Joiner';
            simNoticeDiv.textContent = `Current User Mode (from data): ${mode}`;
        }
    }

    async getHtml(): Promise<string> {
        await this.initialFetchAndSetup();
        const title = new Title({ title: `Lobby ${this.lobbyId}` });
        const titleSection = await title.getHtml();
        const button = new Button();

        const player1BtnHtml = await button.renderButton({
            id: 'player1',
            text: this.currentPlayerDisplay.username || 'You',
            className: `btn ${this.currentPlayerDisplay.isReady ? 'btn-success' : (this.currentPlayerDisplay.isJoined ? 'btn-warning' : 'btn-neutral')}`,
            type: 'button'
        });

        const player2BtnHtml = await button.renderButton({
            id: 'player2',
            text: this.opponentPlayerDisplay.isJoined ? (this.opponentPlayerDisplay.username || 'Opponent') : 'Waiting for Opponent...',
            className: `btn ${this.opponentPlayerDisplay.isReady ? 'btn-success' : (this.opponentPlayerDisplay.isJoined ? 'btn-warning' : 'btn-neutral')}`,
            type: 'button'
        });

        const startGameButtonDef = {
            id: 'startGameBtn',
            text: 'Click when Ready',
            className: 'btn btn-primary',
            type: 'button' as const,
            disabled: true
        };

        const actionButtonsGroup = await button.renderGroup({
            layout: 'group',
            align: 'center',
            buttons: [
                startGameButtonDef,
                { id: 'leaveBtn', text: 'Leave Lobby', className: 'btn btn-danger', type: 'button', href: '/lobbylist' }
            ]
        });

        let inviteListCardHtml = '';

        const currentParticipantIds = this.currentLobbyFullData?.participants.map(p => p.id) || [];
        const filteredUsersForInvite = this.usersForInviteList.filter(u =>
            u.id !== this.currentUser?.id && !currentParticipantIds.includes(u.id)
        );

        if (filteredUsersForInvite.length > 0) {
            const card = new Card();
            const renderedRows = await Promise.all(filteredUsersForInvite.map(async user => {
                const inviteBtnRaw = await button.renderButton({
                    id: `invite-${user.id}`,
                    text: 'Invite',
                    className: 'btn-sm btn-primary invite-btn',
                    type: 'button',
                });
                return `<tr><td>${user.username}</td><td class="text-right">${inviteBtnRaw.replace('<button', `<button data-user="${user.id}"`)}</td></tr>`;
            }));
            inviteListCardHtml = await card.renderCard({
                title: 'Invite List',
                extra: `<table class="list" data-height="300px"><thead><tr><th>Username</th><th></th></tr></thead><tbody>${renderedRows.join('\n')}</tbody></table>`
            });
        }

        const playerStatusCard = await new Card().renderCard({
            title: 'Match Setup',
            extra: `<div class="lobby-layout">
                <div class="invite-list-container hidden">${inviteListCardHtml}</div>
                <div class="matchup-view-container">
                    <div class="lobby-center text-center">
                        ${player1BtnHtml}<div class="vs my-2 font-bold text-lg">VS</div>${player2BtnHtml}
                    </div>
                    <div class="lobby-actions mt-4">${actionButtonsGroup}</div>
                </div>
            </div>`
        });

        const debugCardHtml = await new Card().renderCard({
            title: 'Debug Info',
            extra: `<div id="debug-info" class="flex flex-wrap gap-4"></div>`
        });

        const simNotice = `<div class="sim-notice text-sm text-yellow-500 font-mono mb-2"></div>`;

        return this.render(`
            <div class="container lobby-page-container">
                ${simNotice}
                ${titleSection}
                ${playerStatusCard}
                ${debugCardHtml}
                <div class="text-right mt-4 space-x-2">
                    <button id="ToggleSimRole" class="btn btn-info btn-sm">Simulate Role Switch (Creator/Joiner)</button>
                    <button id="opponentPlayerAcceptInviteSim" class="btn btn-secondary btn-sm">Simulate Opponent Accept Invite</button>
                    <button id="opponentPlayerReadySim" class.btn btn-warning btn-sm">Simulate Opponent Click Start</button>
                </div>
            </div>
        `);
    }


    private handleLobbyDetailsUpdated = (event: CustomEvent) => {
        const lobbyData = event.detail.lobbyData as LobbyDataWithParticipants | null;
        if (lobbyData && lobbyData.id === this.lobbyId) {
            this.processLobbyDataUpdate(lobbyData);
        } else if (!lobbyData && event.detail.lobbyId === this.lobbyId) {
        }
    }

    private handlePlayerJoinedEvent = (event: CustomEvent) => {
        console.log('[Lobby.ts] Event: LOBBY_PLAYER_JOINED_EVENT:', event.detail);
    }

    private handleInviteSentEvent = (event: CustomEvent) => {
        console.log('[Lobby.ts] Event: LOBBY_INVITE_SENT_EVENT:', event.detail);
        const { userId } = event.detail;
        const inviteButton = document.querySelector(`.invite-btn[data-user="${userId}"]`) as HTMLButtonElement | null;
        if (inviteButton) {
            // LobbyService already does optimistic update. This is for any additional reaction.
            // inviteButton.textContent = 'Pending...';
            // inviteButton.disabled = true;
        }
    }

    async mount(): Promise<void> {
        if (!this.lobbyId || !this.currentUser) {
            console.log("[Lobby.ts] Mount aborted due to missing lobbyId or currentUser.");
            return;
        }

        this.refreshAllUIComponents();

        document.addEventListener(LOBBY_DETAILS_UPDATED_EVENT, this.handleLobbyDetailsUpdated as EventListener);
        document.addEventListener(LOBBY_PLAYER_JOINED_EVENT, this.handlePlayerJoinedEvent as EventListener);
        document.addEventListener(LOBBY_INVITE_SENT_EVENT, this.handleInviteSentEvent as EventListener);

        document.addEventListener(LOBBY_GAME_STARTED_EVENT, (e: any) => {
            if (e.detail.lobbyId === this.lobbyId) {
                console.log('[Lobby.ts] Game is starting (from LOBBY_GAME_STARTED_EVENT):', e.detail);
            }
        });

        console.log(`[Lobby.ts Mount] Requesting lobby list to get details for lobby ${this.lobbyId}`);
        GameService.message.requestLobbyList();

        this.setupSimulationButtonListeners();
    }

    async unmount(): Promise<void> {
        document.removeEventListener(LOBBY_DETAILS_UPDATED_EVENT, this.handleLobbyDetailsUpdated as EventListener);
        document.removeEventListener(LOBBY_PLAYER_JOINED_EVENT, this.handlePlayerJoinedEvent as EventListener);
        document.removeEventListener(LOBBY_INVITE_SENT_EVENT, this.handleInviteSentEvent as EventListener);
    }

    private setupSimulationButtonListeners(): void {
        // Simulate Opponent Accept Invite
        document.getElementById('opponentPlayerAcceptInviteSim')?.addEventListener('click', () => {
            if (!this.lastInvitedUserSim || !this.currentUser) {
                alert('Sim Error: "Invite" a user first using an invite button (or ensure current user is set).'); return;
            }
            console.log('[SimClick] Simulating Opponent Accept Invite:', this.lastInvitedUserSim.username);

            // Create a plausible opponent state
            const simOpponent: LobbyParticipant = {
                ...this.lastInvitedUserSim,
                isReady: false,
            };

            const simCurrentUser: LobbyParticipant = {
                ...this.currentUser,
                isReady: false,
            };

            const simulatedLobbyData: LobbyDataWithParticipants = {
                id: this.lobbyId,
                name: this.currentLobbyFullData?.name || `SimLobby ${this.lobbyId}`,
                creatorId: this.currentUser.id,
                maxPlayers: 2,
                currentPlayers: 2,
                isPublic: true,
                hasPassword: false,
                createdAt: this.currentLobbyFullData?.createdAt || new Date(),
                lobbyType: this.currentLobbyFullData?.lobbyType || "game",
                isStarted: false,
                participants: [simCurrentUser, simOpponent]
            };
            this.processLobbyDataUpdate(simulatedLobbyData);
        });

        // Simulate Opponent Click Start
        document.getElementById('opponentPlayerReadySim')?.addEventListener('click', () => {
            console.log('[SimClick] Simulating Opponent Click Start');
            if (!this.opponentPlayerDisplay.isJoined) {
                alert('Sim Error: Opponent has not "joined" yet. Simulate accept invite first.'); return;
            }
            if (this.opponentPlayerDisplay.isReady || !this.currentLobbyFullData) return;


            const updatedOpponent = { ...this.opponentPlayerDisplay, isReady: true };

            const newParticipants = this.currentLobbyFullData.participants.map(p =>
                p.id === updatedOpponent.id ? updatedOpponent as LobbyParticipant : p
            );

            this.processLobbyDataUpdate({
                ...this.currentLobbyFullData,
                participants: newParticipants
            });

            if (this.currentPlayerDisplay.isReady && updatedOpponent.isReady) {
                console.log('[SimGame] Both players ready. Simulating game start redirect...');
                Router.redirect(`/pong/${this.lobbyId}`);
            }
        });

        document.getElementById('ToggleSimRole')?.addEventListener('click', () => {
            if (!this.currentUser || !this.currentLobbyFullData) return;
            console.log('[SimClick] Toggling simulated role display');

            const currentIsCreator = this.currentLobbyFullData.creatorId === this.currentUser.id;
            const newSimulatedCreatorId = currentIsCreator
                ? (this.opponentPlayerDisplay.id || 0)
                : this.currentUser.id;

            this.processLobbyDataUpdate({
                ...this.currentLobbyFullData,
                creatorId: newSimulatedCreatorId
            });
            this.updateSimNotice();
        });


        document.querySelectorAll('.invite-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                const userIdStr = btn.getAttribute('data-user');
                if (userIdStr) {
                    const userIdNum = parseInt(userIdStr, 10);
                    this.lastInvitedUserSim = this.usersForInviteList.find(u => u.id === userIdNum) || null;
                    console.log('[Sim] Last invited user for simulation set to:', this.lastInvitedUserSim);
                }
            });
        });
    }
}
