// ========================
// File: views/Login.ts
// ========================

import ThemedView from '../theme/themedView.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';

export default class Login extends ThemedView {
	constructor() {
		super('starship', 'Transcendence - Login');
	}

	async renderView(): Promise<string> {
		const button = new Button(this.params);

		const card = new Card(this.params);
		const loginCard = await card.renderCard({
			title: 'Login',
			formId: 'login-form',
			inputs: [
				{ name: 'username', type: 'text', placeholder: 'Username' },
				{ name: 'password', type: 'password', placeholder: 'Password' }
			],
			button: { text: 'Login', type: 'submit' },
			extra: '<p>May want to <a router href="/signup">sign up</a></p>'
		});

		return this.render(`
			<div class="flex justify-center items-center min-h-[80vh] px-4">
				<div class="w-full max-w-xl space-y-8">
					${loginCard}
				</div>
			</div>
		`);
	}
}
