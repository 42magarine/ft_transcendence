import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';

export default class Pong extends AbstractView {
    private lobbyId: string;

    constructor(params: URLSearchParams) {
        super();
        this.params = params;
        this.lobbyId = params.get('id') || '';
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
                        {
                            type: 'separator',
                        },
                        {
                            type: 'buttongroup',
                            props:
                            {
                                layout: 'group',
                                align: 'center',
                                buttons:
                                    [
                                        {
                                            id: 'pauseGameButton',
                                            text: 'Pause',
                                            className: 'btn btn-primary'
                                        },
                                        {
                                            id: 'resumeGameButton',
                                            text: 'Resume',
                                            className: 'btn btn-primary'
                                        },
                                        {
                                            id: 'resetGameButton',
                                            text: 'Reset',
                                            className: 'btn btn-primary'
                                        },
                                        {
                                            id: 'lobbyGameButton',
                                            text: 'Back to Lobby',
                                            className: 'btn btn-primary',
                                            href: `/lobby/${this.lobbyId}`
                                        }
                                    ]
                            }
                        }
                    ]
            });
        return this.render(`${gameCard}`);
    }
}
