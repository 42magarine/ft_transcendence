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
                { name: 'repeat-password', type: 'password', placeholder: 'Repeat Password' },
                { name: 'enableTwoFactor', type: 'checkbox', placeholder: 'Enable 2FA (Requires Mobile App)' },
                { name: 'tf_one', type: 'number', min: 0, max: 9, className: "tf_numeric" },
                { name: 'tf_two', type: 'number', min: 0, max: 9, className: "tf_numeric" },
                { name: 'tf_three', type: 'number', min: 0, max: 9, className: "tf_numeric" },
                { name: 'tf_four', type: 'number', min: 0, max: 9, className: "tf_numeric" },
                { name: 'tf_five', type: 'number', min: 0, max: 9, className: "tf_numeric" },
                { name: 'tf_six', type: 'number', min: 0, max: 9, className: "tf_numeric" },
                { name: 'secret', type: 'hidden'}
            ],
            button: { text: 'Sign up', type: 'submit', className: "btn btn-primary" },
            extra: '<div id="qr-display"></div><p>May want to <a router href="/login">log in</a></p>'
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
