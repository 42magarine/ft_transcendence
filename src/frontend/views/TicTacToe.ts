import AbstractView from '../../utils/AbstractView.js';

export default class TicTacToe extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.setTitle('Transcendence - TicTacToe');
	}

	async getHtml() {
		this.templateEngine.registerComponent('Card', (await import('../components/Card.js')).default);

		return this.render(`
			<section class="hero space-y-8 max-w-4xl mx-auto p-6">
	
				<h1 class="text-3xl font-bold text-center text-white">Welcome to TicTacToe</h1>
	
				<!-- Game Rules Card -->
				<Card title="Game Rules" className="rounded-2xl bg-gray-800 text-white p-6">
					<p>The rules of TicTacToe are simple:</p>
					<ul class="list-disc list-inside mt-2 space-y-1">
						<li>Players take turns placing their mark (X or O) on the board</li>
						<li>First player to get 3 marks in a row wins</li>
						<li>If the board fills up with no winner, it's a draw</li>
					</ul>
					<ul class="list-disc list-inside mt-2 space-y-1">
						<li>Select a game mode from the list below</li>
						<li>Click on <strong>Play Now</strong> to start</li>
						<li>Use your mouse or finger to mark your spot</li>
						<li>Enjoy the match and try to win!</li>
					</ul>
				</Card>
	
				<!-- Game Grid -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<for each="games" as="game">
							<p>{{game.description}}</p>
							<if condition="game.isNew">
								<span class="badge bg-green-600 text-white px-2 py-1 rounded text-xs">New!</span>
							</if>
							<button class="btn btn-primary w-full">Play Now</button>
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