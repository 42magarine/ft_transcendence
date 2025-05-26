import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';
import __ from "../services/LanguageService.js"

export default class Login extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const card = new Card();
        const mwt = __("May want to");
        const su = __("sign up");
        const dyfgp = __("Did you forget your Password?");
        const rp = __("Reset Password");
        const loginCard = await card.renderCard({
            title: __('Login'),
            formId: 'login-form',
            inputs: [
                { name: 'email', type: 'text', placeholder: __('E-Mail') },
                { name: 'password', type: 'password', placeholder: __('Password') }
            ],
            button: { text: __('Login'), type: 'submit', className: "btn btn-primary" },
            extra: `
                <p>${mwt} <a router href="/signup">${su}</a></p>
                <p>${dyfgp} <a router href="/password-reset">${rp}</a></p>

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
