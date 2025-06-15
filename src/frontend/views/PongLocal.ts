import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';
import localGameService from '../services/LocalGameService.js';
import __ from '../services/LanguageService.js';

export default class PongLocal extends AbstractView {
    constructor(routeParams: Record<string,string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
        this.params = params;
    }

    async getHtml(): Promise<string> {
        const gameCard = await new Card(this.params).renderCard({
            title: window.ls.__('Local Pong Arena'),
            contentBlocks: [
                {
                    type: 'slider',
                    props: {
                        id: 'winScoreInput',
                        label: window.ls.__('Win Score'),
                        min: 1,
                        max: 20,
                        step: 1,
                        value: 10
                    }
                },
                {
                    type: 'slider',
                    props: {
                        id: 'paddleWidthInput',
                        label: window.ls.__('Paddle Width'),
                        min: 5,
                        max: 50,
                        step: 1,
                        value: 20
                    }
                },
                {
                    type: 'slider',
                    props: {
                        id: 'paddleHeightInput',
                        label: window.ls.__('Paddle Height'),
                        min: 10,
                        max: 250,
                        step: 5,
                        value: 100
                    }
                },
                {
                    type: 'slider',
                    props: {
                        id: 'paddleSpeedInput',
                        label: window.ls.__('Paddle Speed'),
                        min: 1,
                        max: 20,
                        step: 1,
                        value: 5
                    }
                },
                {
                    type: 'slider',
                    props: {
                        id: 'ballSizeInput',
                        label: window.ls.__('Ball Size'),
                        min: 5,
                        max: 30,
                        step: 1,
                        value: 10
                    }
                },
                {
                    type: 'slider',
                    props: {
                        id: 'ballSpeedInput',
                        label: window.ls.__('Ball Speed'),
                        min: 1,
                        max: 10,
                        step: 1,
                        value: 3
                    }
                },
                {
                    type: 'buttongroup',
                    props: {
                        layout: 'group',
                        align: 'center',
                        buttons: [
                            {
                                id: 'startGameButton',
                                icon: 'play',
                                text: window.ls.__('Start'),
                                color: 'green'
                            },
                            {
                                id: 'stopGameButton',
                                icon: 'stop',
                                text: window.ls.__('Stop'),
                                color: 'red'
                            },
                            {
                                id: 'resetGameButton',
                                icon: 'rotate-right',
                                text: window.ls.__('Reset'),
                                color: 'blue'
                            }
                        ]
                    }
                },
                { type: 'separator', },
                {
                    type: 'html',
                    props: {
                        html: `
                            <div class="flex justify-center">
                                <canvas id="gameCanvas" width="800" height="600" class="bg-black border-4 border-white rounded-lg shadow-lg"></canvas>
                            </div>
                        `
                    }
                }
            ]
        });

        setTimeout(() => localGameService.onCanvasReady(), 50);
        return this.render(`${gameCard}`);
    }
}
