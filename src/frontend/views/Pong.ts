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
                                        <canvas id="gameCanvas" class="countdown" width="800" height="600"></canvas>
                                    </div>
                                `
                            }
                        },
                    ]
            });
        return this.render(`${gameCard}`);
    }

    async afterRender(): Promise<void> {
        // console.log('--- DEBUGGING PONG.TS AFTERRENDER ---');
        // console.log('Current URL:', window.location.href); // Verify the full URL
        // console.log('Raw this.params object:', this.routeParams); // Log the URLSearchParams object itself

        // this.params.forEach((value, key) => {
        // console.log(`this.params entry - Key: "<span class="math-inline">\{key\}", Value\: "</span>{value}"`);
        // });

        const matchIdString = this.routeParams['matchId'];
        const lobbyIdString = this.routeParams['lobbyId'];

        // console.log('Extracted matchIdString:', matchIdString);
        // console.log('Extracted lobbyIdString:', lobbyIdString);

        const matchId = Number(matchIdString);
        // console.log('Converted matchId:', matchId);

        if (window.pongService) {
            window.pongService.initializeGame(matchId);
            // console.log('Called window.pongService.initializeGame with matchId:', matchId);
        }
        else {
            await new Modal().renderInfoModal({
                id: 'pong-service-missing',
                title: 'Initialization Error',
                message: 'PongService is not initialized. Please refresh the page or rejoin the lobby.',
            });
        }

        // console.log('--- END DEBUGGING PONG.TS AFTERRENDER ---');
    }

    private setupEvents(): void {
        window.pongService.setupEventListener();
    }
}
