// ========================
// File: views/Signup.ts
// ========================

import Card from '../components/Card.js';
import Button from '../components/Button.js';
import AbstractView from '../../utils/AbstractView.js';

export default class Signup extends AbstractView {
	constructor() {
		super();
	}

	async getHtml(): Promise<string> {
		const button = new Button();

		const card = new Card();
		const signupCard = await card.renderCard({
			title: 'Signup',
			prefix: '<div class="signup-avatar"></div>',
			formId: 'signup-form',
			inputs: [
				{ name: 'avatar', type: 'file', placeholder: 'Avatar' },
				{ name: 'displayname', type: 'text', placeholder: 'Name' },
				{ name: 'username', type: 'text', placeholder: 'Username' },
				{ name: 'email', type: 'email', placeholder: 'E-Mail' },
				{ name: 'password', type: 'password', placeholder: 'Password' },
				{ name: 'repeat-password', type: 'password', placeholder: 'Repeat Password' }
			],
			button: { text: 'Sign up', type: 'submit', className: "btn btn-primary" },
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
