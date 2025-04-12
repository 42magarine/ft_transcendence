import AbstractView from '../../utils/AbstractView.js';
import { setBackgroundImage } from '../components/BackgroundManager.js';

export default class Pong extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.setTitle('Transcendence - Pong');
	}

	async getHtml() {
		setBackgroundImage('/assets/backgrounds/pong.png');
		document.getElementById('header-root')!.className =
			'shadow-lg p-8 bg-gradient-to-r from-zinc-900/70 via-gray-800/70 to-zinc-700/70 text-white backdrop-blur-md';
		document.getElementById('footer-root')!.className =
			'py-4 px-6 w-full bg-gradient-to-r from-zinc-900/70 via-gray-800/70 to-zinc-700/70 text-white backdrop-blur-md';

		// Render HTML first
		const html = await this.render(`
			<div class="flex flex-col items-center justify-center gap-6 w-full">
				<canvas id="gameCanvas" width="800" height="600" class="bg-black border-4 border-white rounded-lg shadow-lg"></canvas>
				<div class="flex gap-4">
					<button id="startGameButton" class="btn btn-theme-pong">Start Game</button>
					<button id="pauseGameButton" class="btn btn-theme-pong">Pause</button>
					<button id="resumeGameButton" class="btn btn-theme-pong">Resume</button>
					<button id="resetGameButton" class="btn btn-theme-pong">Reset</button>
				</div>
			</div>
		`);

		// Import the game script after render
		setTimeout(async () => {
			await import('../pong_game.js');
		}, 0);

		return html;
	}
}


/*import AbstractView from '../../utils/AbstractView.js';

export default class Pong extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.setTitle('Transcendence - Pong');
	}

	async getHtml() {
		// Example template with various template engine features
		return this.render(`
			<section class="hero">
				<h1>Welcome to Pong</h1>
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
					<a router href="/bier">test</a>
					</div>
				</for>
				</div>
			</section>
			<section class="hero">
				<h1>Welcome to Pong</h1>
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
					<div class="card">
					<h3>{{ game.title }}</h3>
					<p>{{ game.description }}</p>
					<if condition="game.isNew">
						<span class="badge">New!</span>
					</if>
					<a router href="/bier">test</a>
					</div>
				</for>
				</div>
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
}*/