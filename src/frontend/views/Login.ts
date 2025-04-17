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

		// Sign In and Sign Up Buttons
		const buttonGroup = await button.renderGroup({
			align: 'center',
			layout: 'group',
			buttons: [
				{ id: 'login-btn', text: 'Login', type: 'submit' },
				{ id: 'signup-btn', text: 'Sign Up', type: 'button', className: 'btn-secondary' }
			]
		});

		const card = new Card(this.params);
		const loginCard = await card.renderCard({
			title: 'Login',
			formId: 'auth-form',
			inputs: [
				{ name: 'username', placeholder: 'Username' },
				{ name: 'password', type: 'password', placeholder: 'Password' },
				{ name: 'repeat-password', type: 'password', placeholder: 'Repeat Password' }
			],
			extra: `<div class="pt-4">${buttonGroup}</div>`
		});

		return this.render(`
			<div class="flex justify-center items-center min-h-[80vh] px-4">
				<div class="w-full max-w-xl space-y-8">
					${loginCard}
				</div>
			</div>

			<script type="module">
				document.getElementById('signup-btn')?.addEventListener('click', () => {
					const repeatField = document.querySelector('input[name="repeat-password"]');
					const loginBtn = document.getElementById('login-btn');
					const signupBtn = document.getElementById('signup-btn');

					if (repeatField) repeatField.classList.remove('hidden');
					if (loginBtn) loginBtn.classList.add('hidden');
					if (signupBtn) signupBtn.setAttribute('type', 'submit');
				});
			</script>
		`);
	}
}
