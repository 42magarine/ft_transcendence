// Pong.ts (view)
import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';
import PongService from '../services/PongService.js';

export default class Pong extends AbstractView {
    private lobbyId: string;
    private pongService: PongService;
    private serviceInitialized: boolean = false;

    constructor(params: URLSearchParams) {
        super();
        this.params = params;
        this.lobbyId = params.get('id') || '';
        this.pongService = new PongService();
    }

    async getHtml(): Promise<string> {
        const gameCard = await new Card(this.params).renderCard(
            {
                title: 'Pong Arena',
                contentBlocks:
                [
                    {
                        type: 'html',
                        props:
                        {
                            html: `
                            <div class="flex justify-center">
                            <canvas id="gameCanvas" width="800" height="600" class="bg-black border-4 border-white rounded-lg shadow-lg"></canvas>
                            </div>
                            `
                        }
                    },
                ]
            });
            if (!this.serviceInitialized) {
                const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
                if (canvas) {
                    this.pongService.initialize(canvas);
                    this.serviceInitialized = true;
                    console.log("[Pong View] Canvas found and PongService initialized.");
                } else {
                    console.error("[Pong View] Could not find gameCanvas element after rendering.");
                }
            }
        return this.render(`${gameCard}`);
    }

    async onDestroy(): Promise<void> {
        this.pongService.destroy();
        console.log("[Pong View] View destroyed, PongService cleanup initiated.");
    }
}
