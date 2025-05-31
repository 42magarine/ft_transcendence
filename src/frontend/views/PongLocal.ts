import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';
import localGameService from '../services/LocalGameService.js';

export default class PongLocal extends AbstractView
{
	constructor(params: URLSearchParams)
	{
		super();
		this.params = params;
	}

	async getHtml(): Promise<string> {
		const gameCard = await new Card(this.params).renderCard({
			title: 'Pong Arena',
			contentBlocks: [
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
	
		setTimeout(() => localGameService.onCanvasReady(), 0); // Wait a tick to ensure DOM is ready
		return this.render(`${gameCard}`);
	}
}
