import AbstractView from '../../utils/AbstractView.js';
import Button from '../components/Button.js';
import Card from '../components/Card.js';

export default class Lobby extends AbstractView {

	constructor(params: URLSearchParams) {
		super();
		this.params = params;
	}

	async getHtml(): Promise<string> {

		const buttonGroup = await new Button().renderGroup({
			layout: 'group',
			align: 'center',
			buttons: [
				{
					id: 'startGameButton',
					type: "submit",
					text: 'Start Game',
					className: "btn btn-primary",
					// disabled: true // Initially disabled until lobby is ready
				},
				{
					id: 'readyButton',
					type: "button",
					text: 'Ready',
					className: "btn btn-secondary"
				}
			]
		});

		const card = new Card(this.params);
		const gameCard = await card.renderCard({
			title: 'Game Lobby',
			body: `
				<div class="flex flex-col gap-6 items-center justify-center">
					<canvas id="gameCanvas" width="800" height="600" class="bg-black border-4 border-white rounded-lg shadow-lg"></canvas>
					<div id="lobbyStatus" class="text-center text-gray-600">
						Waiting for players to join...
					</div>
					${buttonGroup}
				</div>
			`
		});

		// Main page output
		const html = this.render(`
			<div class="flex justify-center items-center min-h-[80vh] px-4">
				${gameCard}
			</div>
		`);

		// Dynamically load the lobby service script
		setTimeout(() => {
			import('../services/LobbyService.js')
				.then(() => console.log('Lobby script loaded'))
				.catch(err => console.error('Failed to load Lobby script', err));
		}, 0);


		return html;
	}
}
