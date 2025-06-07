import Router from '../../utils/Router.js';
import { IServerMessage, ILobbyState as ITournamentState } from '../../interfaces/interfaces.js';

export default class TournamentListService {
    private tournamentData: ITournamentState[] = [];
    private currentTournamentRequest: Promise<ITournamentState[]> | null = null;
    private tournamentDataResolver: ((tournaments: ITournamentState[]) => void) | null = null;

    public handleSocketMessage = (event: MessageEvent<string>): void => {
        const data: IServerMessage = JSON.parse(event.data);
        // console.log("TournamentListService msg received: " + data)
        switch (data.type) {
            case 'tournamentList':
                this.tournamentData = data.tournaments || [];
                if (this.tournamentDataResolver) {
                    this.tournamentDataResolver(this.tournamentData);
                    this.tournamentDataResolver = null;
                }
                break;

            case 'tournamentCreated':
                if (window.currentUser && data.owner != window.currentUser.id) {
                    const path = window.location.pathname;
                    if (path === '/tournamentlist' ||
                        path === '/tournaments' ||
                        path.includes('/tournament/')) {
                        Router.update();
                    }
                }
                if (window.currentUser && data.owner === window.currentUser.id &&
                    data.tournamentId && window.messageHandler) {
                    window.messageHandler.getTournamentList();
                    Router.redirect(`/tournament/${data.tournamentId}`);
                }
                break;

            case 'tournamentJoined':
                if (data.tournamentId) {
                    Router.redirect(`/tournament/${data.tournamentId}`);
                }
                break;

            case 'tournamentLeft':
                const path = window.location.pathname;
                if (path === '/tournamentlist' ||
                    path === '/tournaments' ||
                    path.includes('/tournament/')) {
                    Router.update();
                }
                break;
        }
    }

    public async getTournaments(): Promise<ITournamentState[]> {
        if (!window.messageHandler) {
            console.warn("TournamentListService: messageHandler not available");
            return this.tournamentData;
        }

        if (!window.ft_socket || window.ft_socket.readyState !== WebSocket.OPEN) {
            console.warn("TournamentListService: WebSocket not open");
            return this.tournamentData;
        }

        // Wenn bereits eine Anfrage läuft, diese zurückgeben
        if (this.currentTournamentRequest) {
            return this.currentTournamentRequest;
        }

        // Neues Promise erstellen das auf Server-Antwort wartet
        this.currentTournamentRequest = new Promise<ITournamentState[]>((resolve) => {
            this.tournamentDataResolver = (tournaments: ITournamentState[]) => {
                this.currentTournamentRequest = null;
                resolve(tournaments);
            };
        });

        try {
            await window.messageHandler.getTournamentList();
        }
        catch (error) {
            this.currentTournamentRequest = null;
            throw error;
        }

        return this.currentTournamentRequest;
    }

    public setupEventListener(): void {
        const createTournamentBtn = document.getElementById('createTournamentBtn');
        if (createTournamentBtn) {
            createTournamentBtn.addEventListener('click', this.handleCreateTournamentClick);
        }
    }

    public handleCreateTournamentClick = async (e: MouseEvent): Promise<void> => {
        e.preventDefault();

        if (!window.currentUser?.id) {
            console.warn("TournamentListService: User not logged in or missing ID");
            return;
        }

        if (!window.messageHandler) {
            console.warn("TournamentListService: messageHandler not available");
            return;
        }

        try {
            await window.messageHandler.createTournament(window.currentUser.id);
        }
        catch (error) {
            console.error("TournamentListService: Error creating tournament:", error);
        }
    }
}
