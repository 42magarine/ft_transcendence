// Pong.ts (view)
import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';

export default class Pong extends AbstractView {
    constructor() {
        super();
        this.initEvents = this.setupEvents.bind(this);
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
                                <div id="gameCanvasWrap" class="m-auto">
                                    <div id="gameCanvasWrap-overlay">3</div>
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
        if (!this.params)
            return;

        if (window.pongService)
        {
            window.pongService.initializeGame(Number(this.params.values['name']))
        }

    }

    private setupEvents(): void {
        window.pongService.setupEventListener();
    }
}
