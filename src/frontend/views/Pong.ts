// ========================
// File: views/Pong.ts
// ========================

import AbstractView from '../../utils/AbstractView.js';
import { setBackgroundImage } from '../components/BackgroundManager.js';

export default class Pong extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.setTitle('Transcendence - Pong');
	}

	async getHtml() {
		setBackgroundImage('/assets/backgrounds/pong.png');
		document.getElementById('header-root')?.classList.add(
			'bg-gradient-to-r', 'from-zinc-900/70', 'via-gray-800/70', 'to-zinc-700/70',
			'text-white', 'backdrop-blur-md', 'shadow-lg', 'p-8'
		);

		document.getElementById('footer-root')?.classList.add(
			'bg-gradient-to-r', 'from-zinc-900/70', 'via-gray-800/70', 'to-zinc-700/70',
			'text-white', 'backdrop-blur-md', 'py-4', 'px-6', 'w-full'
		);

		return this.render(`
			<section class="hero">
				<h1>Welcome to Pong</h1>
			</section>
		`, {});
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