import Card from '../components/Card.js';
import Button from '../components/Button.js';
import Input from '../components/Input.js';
import AbstractView from '../../utils/AbstractView.js';
import type { InputField, ContentBlock } from '../../interfaces/abstractViewInterfaces.js';

export default class Signup extends AbstractView {
	constructor() {
		super();
	}

	private async renderTwoFactorSection(): Promise<string> {
		const input = new Input();

		const secretInput = await input.renderInput({
			id: 'secret',
			name: 'secret',
			type: 'hidden',
		});

		const tfCodeInputs = await input.renderNumericGroup(6, 'tf');

		return `
			<div id="twoFactorInterface">
				<div id="qr-display" class="mb-4"></div>
				${secretInput}
				${tfCodeInputs}
			</div>
		`;
	}

	async getHtml(): Promise<string> {
		const input = new Input();
		const card = new Card();
		const button = new Button();

		const googleSignin = await button.renderButton({
			id: 'google-signup',
			type: 'google-signin',
			align: 'center',
		});

		const formInputs: InputField[] = [
			{ name: 'avatar', type: 'file', placeholder: 'Avatar' },
			{ name: 'displayname', type: 'text', placeholder: 'Name' },
			{ name: 'username', type: 'text', placeholder: 'Username' },
			{ name: 'email', type: 'email', placeholder: 'E-Mail' },
			{ name: 'password', type: 'password', placeholder: 'Password', withConfirm: true },
			{ name: 'repeat-password', type: 'password', placeholder: 'Repeat Password' },
			{ name: 'enableTwoFactor', type: 'checkbox', placeholder: 'Enable 2FA (Requires Mobile App)' },
		];

		const twoFactorHtml = await this.renderTwoFactorSection();

		const contentBlocks: ContentBlock[] = [
            ...formInputs.map(input => ({ type: 'input' as const, props: input })),
            { type: 'html', props: { html: twoFactorHtml } },
            { type: 'html', props: { html: `
                <p>Already have an account? <a router href="/login">log in</a></p>
                ${googleSignin}
            `}},
        ];
        
        const signupCard = await card.renderCard({
            title: 'Signup',
            formId: 'signup-form',
            prefix: '<div class="signup-avatar"></div>',
            contentBlocks,
            button: {
                text: 'Sign up',
                type: 'submit',
                className: 'btn btn-primary'
            }
        });        

		return this.render(signupCard);
	}
}
