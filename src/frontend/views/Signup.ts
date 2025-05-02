// ========================
// File: views/Signup.ts
// ========================

import ThemedView from '../theme/themedView.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';

export default class Signup extends ThemedView {
	constructor() {
		super('starship', 'Transcendence - Signup');
	}

	async renderView(): Promise<string> {
		const button = new Button(this.params);

		const card = new Card(this.params);
		const signupCard = await card.renderCard({
			title: 'Signup',
			prefix: '<div class="signup-avatar"></div>',
			formId: 'signup-form',
			inputs: [
				{ name: 'displayname', type: 'text', placeholder: 'Name' },
				{ name: 'username', type: 'text', placeholder: 'Username' },
				{ name: 'email', type: 'email', placeholder: 'E-Mail' },
				{ name: 'password', type: 'password', placeholder: 'Password' },
				{ name: 'repeat-password', type: 'password', placeholder: 'Repeat Password' }
			],
			button: { text: 'Sign up', type: 'submit' },
			extra: '<p>May want to <a router href="/login">log in</a></p>'
		});

		return this.render(`
			<div class="flex justify-center items-center min-h-[80vh] px-4">
				<div class="w-full max-w-xl space-y-8">
					${signupCard}
				</div>
			</div>
		`);
	}
}
