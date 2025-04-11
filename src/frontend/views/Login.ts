// ========================
// File: views/Login.ts
// ========================

import AbstractView from '../../utils/AbstractView.js';
import { setBackgroundImage } from '../components/BackgroundManager.js';

export default class Login extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.setTitle('Transcendence - Login');
	}

	async getHtml() {
        setBackgroundImage('/assets/backgrounds/home.png');
		document.getElementById('header-root')!.className = 'shadow-lg p-8 bg-gradient-to-r from-indigo-900/80 via-blue-900/80 to-sky-900/80 text-white backdrop-blur-md';
		document.getElementById('footer-root')!.className = 'py-4 px-6 w-full bg-gradient-to-r from-indigo-900/80 via-blue-900/80 to-sky-900/80 text-white backdrop-blur-md';

		return this.render(`
			<div class="flex justify-center items-center min-h-[80vh]">
				<div class="max-w-4xl w-full p-6 space-y-8">
                    <!-- CREATE -->
                    <div class="card rounded-2xl bg-gray-800">
                        <div class="card-body space-y-4">
                            <h2 class="card-title text-white">Login</h2>
                            <form id="auth-form" class="space-y-2">
                                <input type="text" id="username" placeholder="User" required class="w-full p-2 rounded" />
                                <input type="password" id="password" placeholder="Password" required class="w-full p-2 rounded" />
                                <input type="password" id="repeat-password" placeholder="Repeat Password" required class="w-full p-2 rounded hidden" />
                                <button id="login-btn" type="submit" class="btn btn-theme-home w-full">Login</button>
                                <button id="signup-btn" type="button" class="btn btn-theme-home w-full">Sign Up</button>
                            </form>
                        </div>
                    </div>
				</div>
			</div>
			<script type="module">
				document.getElementById('signup-btn')?.addEventListener('click', () => {
					document.getElementById('repeat-password')?.classList.remove('hidden');
					document.getElementById('login-btn')?.classList.add('hidden');
					document.getElementById('signup-btn')?.setAttribute('type', 'submit');
				});
			</script>
			<script type="module" src="/dist/frontend/services/user_management.js"></script>
		`, {});
	}
}
