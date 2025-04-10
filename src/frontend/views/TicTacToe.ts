import AbstractView from '../../utils/AbstractView.js';

export default class TicTacToe extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.setTitle('Transcendence - TicTacToe');
	}

	async getHtml() {
		//this.templateEngine.registerComponent('Card', (await import('../components/Card.js')).default);

		return this.render(`
			<section class="hero">
				<h1>Welcome to TicTacToe</h1>

				<Card title="Game Rules" className="primary-card">
					<p>The rules of TicTacToe are simple:</p>
					<ul>
						<li>Players take turns placing their mark (X or O) on the board</li>
						<li>First player to get 3 marks in a row wins</li>
						<li>If the board fills up with no winner, it's a draw</li>
					</ul>
				</Card>

				<div class="game-grid">
					<for each="games" as="game">
						<Card title="{{game.title}}" footer="{{game.status}}">
							<p>{{game.description}}</p>
							<if condition="game.isNew">
								<span class="badge">New!</span>
							</if>
							<button class="btn">Play Now</button>
						</Card>
					</for>
				</div>
			</section>
		`, {
			games: [
				{
					title: 'TicTacToe Classic',
					description: 'The original 3x3 game that everyone loves',
					isNew: false,
					status: 'Most Popular'
				},
				{
					title: 'TicTacToe Extreme',
					description: 'Play on a 5x5 grid with new special moves',
					isNew: true,
					status: 'Just Released'
				},
				{
					title: 'TicTacToe Tournament',
					description: 'Compete against others in a tournament format',
					isNew: false,
					status: '4 Players Online'
				}
			]
		});
	}
}