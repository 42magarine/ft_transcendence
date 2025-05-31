import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';
import localGameService from '../services/LocalGameService.js';

export default class PongLocal extends AbstractView {
	constructor(params: URLSearchParams) {
		super();
		this.params = params;
	}

	async getHtml(): Promise<string> {
		const gameCard = await new Card(this.params).renderCard({
			title: 'Pong Arena',
			contentBlocks: [
				{ type: 'separator' },
				{ type: 'slider', props: {
					id: 'paddleSpeedInput',
					label: 'Paddle Speed',
					min: 1,
					max: 20,
					step: 1,
					value: 5
				}},
				{ type: 'slider', props: {
					id: 'paddleHeightInput',
					label: 'Paddle Height',
					min: 10,
					max: 200,
					step: 5,
					value: 100
				}},
				{ type: 'slider', props: {
					id: 'ballSpeedXInput',
					label: 'Ball Speed X',
					min: 1,
					max: 20,
					step: 1,
					value: 5
				}},
				{ type: 'slider', props: {
					id: 'ballSpeedYInput',
					label: 'Ball Speed Y',
					min: 1,
					max: 20,
					step: 1,
					value: 5
				}},
				{ type: 'separator' },				
				{
					type: 'html',
					props: {
						html: `
							<div class="flex justify-center">
								<canvas id="gameCanvas" width="800" height="600" class="bg-black border-4 border-white rounded-lg shadow-lg"></canvas>
							</div>
						`
					}
				},
				{ type: 'separator' },
				{
					type: 'buttongroup',
					props: {
						layout: 'grid',
						align: 'center',
						buttons: [
							{ id: 'startGameButton', text: 'Start', className: 'btn btn-primary' },
							{ id: 'pauseGameButton', text: 'Pause', className: 'btn btn-primary' },
							{ id: 'resumeGameButton', text: 'Resume', className: 'btn btn-primary' },
							{ id: 'resetGameButton', text: 'Reset', className: 'btn btn-primary' }
						]
					}
				}
			]
		});

		setTimeout(() => localGameService.onCanvasReady(), 0);
		return this.render(`${gameCard}`);
	}
}
