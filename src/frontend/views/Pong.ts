import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';
import Modal from '../components/Modal.js'

export default class Pong extends AbstractView {
    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
        this.initEvents = this.setupEvents.bind(this);
    }

    async getHtml(): Promise<string> {
        // kA wie man die variablen da in den div kack rein kriegt ${player1} nix funktioniert diese @jonathan
        const player1: string = window.pongService.getPlayer1Name();
        const player2: string = window.pongService.getPlayer2Name();
        const gameCard = await new Card({}, this.params).renderCard(
            {
                title: window.ls.__('Pong Arena'),
                contentBlocks:
                    [
                        {
                            type: 'html',
                            props:
                            {
                                html: `
                                    <div id="playerCanvasWrap">
                                        <div class="player-name player1">${player1}</div>
                                        <div class="player-name player2">${player2}</div>
                                    </div>
                                    <div id="gameCanvasWrap" class="m-auto">
                                        <div id="gameCanvasWrap-overlay"></div>
                                        <canvas id="gameCanvas" class="countdown"></canvas>
                                    </div>
                                `
                            }
                        },
                    ]
            });
        return this.render(`${gameCard}`);
    }

    async afterRender(): Promise<void> {

        const matchIdString = this.routeParams['matchId'];
        const lobbyIdString = this.routeParams['lobbyId'];

        const matchId = Number(matchIdString);

        if (window.pongService) {
            window.pongService.initializeGame(matchId);
        }
        else {
            await new Modal().renderInfoModal({
                id: 'pong-service-missing',
                title: 'Initialization Error',
                message: 'PongService is not initialized. Please refresh the page or rejoin the lobby.',
            });
        }
    }

    private setupEvents(): void {
        window.pongService.setupEventListener();
    }
}
