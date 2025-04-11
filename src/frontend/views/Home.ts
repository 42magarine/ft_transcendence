// ========================
// File: views/Home.ts
// ========================

import AbstractView from '../../utils/AbstractView.js';
import { setBackgroundImage } from '../components/BackgroundManager.js';

export default class Home extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.setTitle('Transcendence - Home');
	}

	async getHtml() {
		setBackgroundImage('/assets/backgrounds/home.png');
		document.getElementById('header-root')!.className = 'shadow-lg p-8 bg-gradient-to-r from-indigo-900/80 via-blue-900/80 to-sky-900/80 text-white backdrop-blur-md';
		document.getElementById('footer-root')!.className = 'py-4 px-6 w-full bg-gradient-to-r from-indigo-900/80 via-blue-900/80 to-sky-900/80 text-white backdrop-blur-md';

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