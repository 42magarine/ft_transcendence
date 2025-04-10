import AbstractView from '../../utils/AbstractView.js';

export default class Home extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.setTitle('Transcendence - Home');
	}

	async getHtml() {
		return this.render(`
			<section>
				<div class="ml-auto flex gap-2 z-10">
					<a router href="/pong" class="btn btn-secondary btn-theme-pong">Pong</a>
					<a router href="/tictactoe" class="btn btn-secondary btn-theme-tictactoe">TicTacToe</a>
				</div>
			</section>
		`, {});
	}
}