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
			contentBlocks:
				[
					{
						type: 'separator'
					},
					{
						type: 'slider',
						props: {
							id: 'paddleSpeedInput',
							label: 'Paddle Speed',
							min: 1,
							max: 20,
							step: 1,
							value: 5
						}
					},
					{
						type: 'slider', props: {
							id: 'paddleHeightInput',
							label: 'Paddle Height',
							min: 10,
							max: 200,
							step: 5,
							value: 100
						}
					},
					{
						type: 'slider', props: {
							id: 'ballSpeedInput',
							label: 'Ball Speed',
							min: 1,
							max: 20,
							step: 1,
							value: 5
						}
					},
					{
						type: 'slider', props: {
							id: 'ballSizeInput',
							label: 'Ball Size',
							min: 5,
							max: 30,
							step: 1,
							value: 10
						}
					},
					{
						type: 'slider', props: {
							id: 'paddleWidthInput',
							label: 'Paddle Width',
							min: 5,
							max: 50,
							step: 1,
							value: 20
						}
					},
					{
						type: 'slider', props: {
							id: 'winScoreInput',
							label: 'Win Score',
							min: 1,
							max: 20,
							step: 1,
							value: 5
						}
					},
					{
						type: 'separator'
					},
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
					{
						type: 'separator'
					},
					{
						type: 'buttongroup',
						props:
						{
							layout: 'group',
							align: 'left',
							buttons:
								[
									{
										id: 'startGameButton',
										icon: 'play',
										text: 'Start',
										color: 'green'
									},
									{
										id: 'pauseGameButton',
										icon: 'pause',
										text: 'Pause',
										color: 'yellow'
									},
									{
										id: 'resumeGameButton',
										icon: 'play-circle',
										text: 'Resume',
										color: 'blue'
									},
									{
										id: 'resetGameButton',
										icon: 'rotate-right',
										text: 'Reset',
										color: 'red'
									}
								]

						}
					}
				]
		});

		setTimeout(() => localGameService.onCanvasReady(), 0);
		return this.render(`${gameCard}`);
	}
}
