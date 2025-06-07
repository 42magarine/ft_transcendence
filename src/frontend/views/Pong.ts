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
                                <canvas id="gameCanvas" width="800" height="600" class="bg-black border-4 border-white rounded-lg shadow-lg"></canvas>
                            `
                            }
                        },
                    ]
            });
        return this.render(`${gameCard}`);
    }

    private setupEvents(): void {
        window.pongService.setupEventListener();
    }
}
