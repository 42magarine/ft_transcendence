import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';

export default class Login extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const card = new Card();
        const loginCard = await card.renderCard({
            title: 'Login',
            formId: 'login-form',
            inputs: [
                { name: 'username', type: 'text', placeholder: 'Username' },
                { name: 'password', type: 'password', placeholder: 'Password' }
            ],
            button: { text: 'Login', type: 'submit', className: "btn btn-primary" },
            extra: `
                <p>May want to <a router href="/signup">sign up</a></p>
                <p>Did you forget your Password? <a router href="/password-reset">Reset Password</a></p>

                <!-- Google Sign-In Button -->
                <div id="g_id_onload"
                    data-client_id="671485849622-fgg1js34vhtv9tsrifg717hti161gvum.apps.googleusercontent.com"
                    data-callback="handleGoogleLogin"
                    data-auto_prompt="false">
                </div>
                <div class="g_id_signin"
                    data-type="standard"
                    data-size="medium"
                    data-theme="filled_blue"
                    data-text="signin_with"
                    data-shape="rectangular"
                    data-logo_alignment="left">
                </div>
            `
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
