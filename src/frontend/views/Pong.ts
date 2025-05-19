import Card from '../components/Card.js';
import Button from '../components/Button.js';
import AbstractView from '../../utils/AbstractView.js';
import { LobbyInfo } from '../../interfaces/interfaces.js';

export default class Pong extends AbstractView {
	private lobbyId: string;

	constructor(params: URLSearchParams) {
		super();
		this.params = params;
		this.lobbyId = params.get('id') || '';
	}

	async getHtml(): Promise<string> {

		const buttonGroup = await new Button().renderGroup({
			layout: 'group',
			align: 'center',
			buttons: [
				{ id: 'pauseGameButton', text: 'Pause', className: "btn btn-primary" },
				{ id: 'resumeGameButton', text: 'Resume', className: "btn btn-primary" },
				{ id: 'resetGameButton', text: 'Reset', className: "btn btn-primary" },
				{ id: 'lobbyGameButton', text: 'Back to Lobby', className: "btn btn-primary", href: `/lobby/${this.lobbyId}` }
			]
		});

		const card = new Card(this.params);
		const gameCard = await card.renderCard({
			title: 'Pong Arena',
			body: `
				<div class="flex flex-col gap-6 items-center justify-center">
					<canvas id="gameCanvas" width="800" height="600" class="bg-black border-4 border-white rounded-lg shadow-lg"></canvas>
					${buttonGroup}
				</div>
			`
		});

		const html = this.render(`
			<div class="flex justify-center items-center min-h-[80vh] px-4">
				${gameCard}
			</div>
		`);

		return html;
	}
}
