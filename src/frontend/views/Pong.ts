// ========================
// File: views/Pong.ts
// ========================

import ThemedView from '../theme/themedView.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';
import { ThemeName } from '../theme/themeHelpers.js';

export default class Pong extends ThemedView {
	constructor() {
		super('mechazilla', 'Transcendence - Pong');
	}

	async renderView(): Promise<string> {
		const theme = this.getTheme() as ThemeName;
		const params = new URLSearchParams({ theme });

		const buttonGroup = await new Button(params).renderGroup({
			layout: 'group',
			align: 'center',
			buttons: [
				{ id: 'startGameButton', text: 'Start Game' },
				{ id: 'pauseGameButton', text: 'Pause' },
				{ id: 'resumeGameButton', text: 'Resume' },
				{ id: 'resetGameButton', text: 'Reset' }
			]
		});

		const card = new Card(params);
		const gameCard = await card.renderCard({
			title: 'Pong Arena',
			body: `
				<div class="flex flex-col gap-6 items-center justify-center">
					<canvas id="gameCanvas" width="800" height="600" class="bg-black border-4 border-white rounded-lg shadow-lg"></canvas>
					${buttonGroup}
				</div>
			`
		});

		// Main page output
		const html = this.render(`
			<div class="flex justify-center items-center min-h-[80vh] px-4">
				${gameCard}
			</div>
		`);

		// 👇 Nachträglich pong_game.js importieren
		setTimeout(() => {
			// @ts-ignore
			import('/dist/frontend/pong_game.js')
				.then(() => console.log('[Pong] Game script loaded'))
				.catch(err => console.error('[Pong] Failed to load game script', err));
		}, 0);

		return html;
	}
}
