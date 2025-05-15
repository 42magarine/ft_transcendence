import Card from '../components/Card.js';
import Button from '../components/Button.js';
import AbstractView from '../../utils/AbstractView.js';

export default class Login extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const button = new Button();

        const card = new Card();
        const loginCard = await card.renderCard({
            title: 'Login',
            formId: 'login-form',
            inputs: [
                { name: 'username', type: 'text', placeholder: 'Username' },
                { name: 'password', type: 'password', placeholder: 'Password' }
            ],
            button: { text: 'Login', type: 'submit', className: "btn btn-primary" },
            extra: '<p>May want to <a router href="/signup">sign up</a></p><p>Did you forget your Password <a router href="/password-reset">Reset Password</a></p>'
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
