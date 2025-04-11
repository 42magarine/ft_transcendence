// ========================
// File: views/TicTacToe.ts
// ========================

import AbstractView from '../../utils/AbstractView.js';
import { setBackgroundImage } from '../components/BackgroundManager.js';

export default class TicTacToe extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.setTitle('Transcendence - TicTacToe');
	}

	async getHtml() {
		setBackgroundImage('/assets/backgrounds/tictactoe.png');
		document.getElementById('header-root')!.className = 'shadow-lg p-8 bg-gradient-to-r from-sky-600/70 via-sky-100/70 to-white/70 text-black backdrop-blur-md';
		document.getElementById('footer-root')!.className = 'py-4 px-6 w-full bg-gradient-to-r from-[#6b4b3a]/80 via-[#7a5a45]/80 to-[#8b6a55]/80 text-white backdrop-blur-md';

		this.templateEngine.registerComponent('Card', (await import('../components/Card.js')).default);

		return this.render(`
			<section class="hero space-y-8 max-w-4xl mx-auto p-6">
				<h1 class="text-3xl font-bold text-center text-white">Welcome to TicTacToe</h1>
				<!-- Cards go here -->
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