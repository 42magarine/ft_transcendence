// ========================
// File: views/Login.ts
// ========================

import ThemedView from '../theme/themedView.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';
import { ThemeName } from '../theme/themeHelpers.js';

export default class Login extends ThemedView {
	constructor() {
		super('starship', 'Transcendence - Login');
	}

	async renderView(): Promise<string> {
		const theme = this.getTheme() as ThemeName;

		const buttonGroup = await new Button(new URLSearchParams({ theme })).renderGroup({
			align: 'center',
			layout: 'stack',
			buttons: [
				{
					id: 'login-btn',
					text: 'Login',
					type: 'submit'
				},
				{
					id: 'signup-btn',
					text: 'Sign Up',
					type: 'button'
				}
			]
		});

		const loginCard = await new Card(new URLSearchParams({ theme })).renderCard({
			title: 'Login',
			formId: 'auth-form',
			inputs: [
				{ name: 'username', placeholder: 'User' },
				{ name: 'password', type: 'password', placeholder: 'Password' },
				{ name: 'repeat-password', type: 'password', placeholder: 'Repeat Password' }
			],
			extra: buttonGroup
		});

		return this.render(`
			<div class="flex justify-center items-center min-h-[80vh]">
				<div class="max-w-4xl w-full p-6 space-y-8">
					${loginCard}
				</div>
			</div>

			<script type="module">
				document.getElementById('signup-btn')?.addEventListener('click', () => {
					const repeatField = document.querySelector('input[name="repeat-password"]');
					const loginBtn = document.querySelector('#login-btn');
					if (repeatField) repeatField.classList.remove('hidden');
					if (loginBtn) loginBtn.classList.add('hidden');
					document.getElementById('signup-btn')?.setAttribute('type', 'submit');
				});
			</script>

			<script type="module" src="/dist/frontend/services/user_management.js"></script>
		`);
	}
}
