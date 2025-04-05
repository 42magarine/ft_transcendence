import AbstractView from '../utils/AbstractView.js';

export default class Bier extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.setTitle('Transcendence - Bier');
	}

	async getHtml() {
		// Example template with various template engine features
		return this.render(`
			<section class="hero">
				<h1>Welcome to Bier</h1>
				<p>{{ user ? 'Welcome back, ' + user.name : 'Join us today!' }}</p>

				<if condition="user && user.isAdmin">
				<div class="admin-panel">
					<h3>Admin Panel</h3>
					<p>You have admin privileges</p>
				</div>
				</if>

				<h2>Featured Games</h2>
				<div class="games-list">
				<for each="featuredGames" as="game">
					<div class="game-card">
					<h3>{{ game.title }}</h3>
					<p>{{ game.description }}</p>
					<if condition="game.isNew">
						<span class="badge">New!</span>
					</if>
					<a data-link href="/">test</a>
					</div>
				</for>
				</div>

				<include src="/components/newsletter-signup.html" />
			</section>
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