import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';

export default class Signup extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const twoFactorInterface = `
			<div id="twoFactorInterface">
				<input type="hidden" name="secret" value="" id="secret">
				<div id="qr-display"></div>
				<div id="tf-code">
					<input type="number" id="tf_one" name="tf_one" value="" placeholder="" min="0" max="9" class="tf_numeric" >
					<input type="number" id="tf_two" name="tf_two" value="" placeholder="" min="0" max="9" class="tf_numeric" >
					<input type="number" id="tf_three" name="tf_three" value="" placeholder="" min="0" max="9" class="tf_numeric" >
					<input type="number" id="tf_four" name="tf_four" value="" placeholder="" min="0" max="9" class="tf_numeric" >
					<input type="number" id="tf_five" name="tf_five" value="" placeholder="" min="0" max="9" class="tf_numeric" >
					<input type="number" id="tf_six" name="tf_six" value="" placeholder="" min="0" max="9" class="tf_numeric" >
				</div>
			</div>`

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
                { name: 'repeat-password', type: 'password', placeholder: 'Repeat Password' },
                { name: 'enableTwoFactor', type: 'checkbox', placeholder: 'Enable 2FA (Requires Mobile App)' }
            ],
            preButton: twoFactorInterface,
            button: { text: 'Sign up', type: 'submit', className: "btn btn-primary" },
            // extra: '<p>May want to <a router href="/login">log in</a></p>'
            extra: `
                <p>May want to <a router href="/login">log in</a></p>

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
                    data-text="signup_with"
                    data-shape="rectangular"
                    data-logo_alignment="left">
                </div>
            `
        });

        if (!document.querySelector('#google-login-script')) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.id = 'google-login-script';
            document.head.appendChild(script);
        }

        return this.render(`
			<div class="flex justify-center items-center min-h-[80vh] px-4">
				<div class="w-full max-w-xl space-y-8">
					${signupCard}
				</div>
			</div>
		`);
    }
}
