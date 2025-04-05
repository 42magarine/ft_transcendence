import AbstractView from '../../../utils/AbstractView.js';

export default class Card extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
	}

	async getHtml() {
		// Example template with various template engine features
		return this.render(`
			<header class="bg-blue-700 white">
				<h1>Header</h1>
			</header>
		`, {
			user: this.params.get('userId') ? { name: 'John', isAdmin: true } : null,
			featuredGames: [
				{ title: 'Pong Extreme', description: 'Classic pong with a twist', isNew: true },
				{ title: 'Space Invaders+', description: 'Defend the earth', isNew: false },
				{ title: 'Tetris Revolution', description: 'Geometric puzzles', isNew: true }
			]
		});
	}
}