import Router from '../../utils/Router.js';
import UserService from '../services/UserService.js';
import { IServerMessage, ILobbyState, IGameSettings } from '../../interfaces/interfaces.js';
import Modal from '../components/Modal.js'
import { SCORE_LIMIT, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED, BALL_RADIUS, BALL_SPEED } from "../../types/constants.js";
export default class LobbyListService {
    private lobbyData: ILobbyState[] = [];
    private lobbyDataResolvers: ((lobbies: ILobbyState[]) => void)[] = [];

    public handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);
        switch (data.type) {
            case 'lobbyList':
                this.lobbyData = data.lobbies || [];
                this.resolveLobbyDataPromises(this.lobbyData);
                break;
            case 'lobbyCreated':
                if (window.currentUser && data.owner != window.currentUser.id && (window.location.pathname === '/lobbylist' || window.location.pathname === '/lobbies' || window.location.pathname.includes("/lobby/"))) {
                    Router.update()
                }
                if (window.currentUser && data.owner == window.currentUser.id && data.lobbyId && window.messageHandler) {
                    window.messageHandler.requestLobbyList();
                    if (data.lobbyType === "game") {
                        Router.redirect(`/lobby/${data.lobbyId}`);
                    }
                    else if (data.lobbyType === "tournament") {
                        Router.redirect(`/tournament/${data.lobbyId}`);
                    }
                }
                break;
            case 'joinedLobby':
                if (window.currentUser && data.owner != window.currentUser.id && (window.location.pathname === '/lobbylist' || window.location.pathname === '/lobbies' || window.location.pathname.includes("/lobby/"))) {
                    window.messageHandler!.requestLobbyList();
                    Router.update()
                }
                if (window.currentUser && data.owner == window.currentUser.id && data.lobbyId && window.messageHandler) {
                    window.messageHandler.requestLobbyList();
                    if (data.lobbyType === "game") {
                        Router.redirect(`/lobby/${data.lobbyId}`);
                    }
                    else if (data.lobbyType === "tournament") {
                        Router.redirect(`/tournament/${data.lobbyId}`);
                    }
                }
                break;
            case 'leftLobby':
                if (window.location.pathname === '/lobbylist' || window.location.pathname === '/lobbies' || window.location.pathname.includes("/lobby/")) {
                    window.messageHandler.requestLobbyList();
                    Router.update()
                }
                break;
        }
    }

    public setupCreateLobbyButtonListener(): void {
        const createGameBtn = document.getElementById('createGameBtn');
        if (createGameBtn) {
            createGameBtn.addEventListener('click', this.handleCreateGameClick);
        }

        const createTournamentBtn = document.getElementById('createTournamentBtn');
        if (createTournamentBtn) {
            createTournamentBtn.addEventListener('click', this.handleCreateTournamentClick);
        }

    }

    public setupJoinLobbyButtonListener(): void {
        const jLButton: NodeListOf<Element> = document.querySelectorAll('.joinLobbyBtn');
        jLButton.forEach((jlb: Element) => {
            jlb.addEventListener('click', this.handleJoinLobbyClick);
        });
    }

    private getAllSettings() : IGameSettings {
        return {
            winScore: this.getSliderValue('winScoreInput', SCORE_LIMIT),
            paddleWidth: this.getSliderValue('paddleWidthInput', PADDLE_WIDTH),
            paddleHeight: this.getSliderValue('paddleHeightInput', PADDLE_HEIGHT),
            paddleSpeed: this.getSliderValue('paddleSpeedInput', PADDLE_SPEED),
            ballSize: this.getSliderValue('ballSizeInput', BALL_RADIUS),
            ballSpeed: this.getSliderValue('ballSpeedInput', BALL_SPEED)
        };
    }



    private getSliderValue(id: string, defaultValue: number): number {
        const input = document.getElementById(id) as HTMLInputElement;
        if (!input) {
            return defaultValue;
        }
        const value = parseInt(input.value);
        return isNaN(value) ? defaultValue : value;
    }


    public handleCreateGameClick = async (e: MouseEvent) => {
        e.preventDefault();

        if (!window.currentUser) {
            return;
        }

        if (window.currentUser) {
            if (window.messageHandler && window.currentUser.id) {
                try {
                    await window.messageHandler.createLobby(window.currentUser.id, "game", 2, this.getAllSettings());
                }
                catch (error) {
                    await new Modal().renderInfoModal({
                        id: 'create-lobby-error',
                        title: 'Lobby Creation Failed',
                        message: error instanceof Error ? error.message : 'An unknown error occurred while creating the lobby.',
                    });
                }
            }
        }
    }

    public handleCreateTournamentClick = async (e: MouseEvent) => {
        e.preventDefault();

        if (!window.currentUser) {
            return;
        }

        if (window.currentUser) {
            if (window.messageHandler && window.currentUser.id) {
                try {
                    await window.messageHandler.createLobby(window.currentUser.id, "tournament", 8, this.getAllSettings());
                }
                catch (error) {
                    await new Modal().renderInfoModal({
                        id: 'create-tournament-error',
                        title: 'Tournament Creation Failed',
                        message: error instanceof Error ? error.message : 'An unknown error occurred while creating the tournament.',
                    });
                }
            }
        }
    }

    public handleJoinLobbyClick = async (e: Event) => {
        e.preventDefault();

        const target = e.target as HTMLElement;
        const lobbyId = target.getAttribute('data-lobby-id');
        if (!lobbyId) {
            await new Modal().renderInfoModal({
                id: 'missing-lobby-id',
                title: 'Missing Lobby ID',
                message: "Couldn't join the lobby because its ID is missing.",
            });
            return;
        }

        const user = await UserService.getCurrentUser();
        if (!user) {
            return;
        }

        if (window.messageHandler) {
            try {
                await window.messageHandler.joinLobby(lobbyId, user.id!);
            }
            catch (error) {
                await new Modal().renderInfoModal({
                    id: 'join-lobby-failed',
                    title: 'Failed to Join Lobby',
                    message: `An error occurred while trying to join the lobby (ID: ${lobbyId}). Please try again later.`,
                });
            }
        }
    }
    public getLobbyList(): ILobbyState[] {
        return this.lobbyData;
    }


    private resolveLobbyDataPromises(lobbies: ILobbyState[]): void {
        this.lobbyDataResolvers.forEach(resolve => resolve(lobbies));
        this.lobbyDataResolvers = [];
    }

    public async getLobbies(): Promise<ILobbyState[]> {
        if (!window.messageHandler) {
            return Promise.resolve(this.lobbyData);
        }

        if (!window.ft_socket || window.ft_socket.readyState !== WebSocket.OPEN) {
            return Promise.resolve(this.lobbyData);
        }

        const promise = new Promise<ILobbyState[]>((resolve) => {
            this.lobbyDataResolvers.push(resolve);
        });

        try {
            await window.messageHandler.requestLobbyList();
        }
        catch (error) {
            await new Modal().renderInfoModal({
                id: 'lobby-fetch-error',
                title: 'Lobby Fetch Failed',
                message: 'Could not load the list of lobbies. Please check your connection and try again.',
            });

            this.resolveLobbyDataPromises(this.lobbyData);
        }

        return promise;
    }
}
