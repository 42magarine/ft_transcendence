// view/pages/Home.ts
import AbstractView from '../AbstractView.js';

export default class Home extends AbstractView {
	constructor(params?: URLSearchParams) {
		super(params);
		this.setTitle('Home | Transcendence');
	}

	async getHtml(): Promise<string> {
		const isLoggedIn = window.getLoggedIn();

		return `
			<div class="home-container">
				<h1>Welcome to Transcendence</h1>
				<p>The ultimate gaming platform</p>

				${isLoggedIn
				? `<div class="action-buttons">
						<a href="/game" data-link class="btn btn-primary">Play Now</a>
						<a href="/profile" data-link class="btn btn-secondary">My Profile</a>
					</div>`
				: `<div class="action-buttons">
						<a href="/login" data-link class="btn btn-primary">Login</a>
						<a href="/register" data-link class="btn btn-secondary">Register</a>
					</div>`
			}

				<div class="features">
					<div class="feature-card">
						<h3>Real-time Tic-Tac-Toe</h3>
						<p>Play against friends in our responsive game rooms</p>
					</div>
					<div class="feature-card">
						<h3>Global Leaderboard</h3>
						<p>Compete with players from around the world</p>
					</div>
					<div class="feature-card">
						<h3>Custom Profiles</h3>
						<p>Personalize your gaming experience</p>
					</div>
				</div>
			</div>
		`;
	}

	async afterRender(): Promise<void> {
		// Check login status and update UI accordingly
		await window.checkLoginStatus();
		window.updateLoginState();
	}
}