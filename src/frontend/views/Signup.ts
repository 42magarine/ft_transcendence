import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';

export default class Signup extends AbstractView
{
	constructor()
	{
		super();
	}

	private renderTwoFactorHtml(): string
	{
		const secretInput = `<input type="hidden" id="secret" name="secret" />`;
		const tfInputs = Array.from({ length: 6 }).map((_, i) => `
			<input type="text" name="tf-${i}" maxlength="1" class="w-10 h-10 text-center border rounded-md" />
		`).join('');
		return `
			<div id="twoFactorInterface">
				<div id="qr-display" class="mb-4"></div>
				${secretInput}
				<div class="flex gap-2 justify-center">${tfInputs}</div>
			</div>
		`;
	}

	async getHtml(): Promise<string>
	{
		const card = new Card();

		const signupCard = await card.renderCard(
		{
			title: 'Signup',
			formId: 'signup-form',
			prefix: '<div class="signup-avatar"></div>',
			className: 'max-w-xl mx-auto',
			contentBlocks:
			[
				{
					type: 'input',
					props:
					{
						name: 'avatar',
						type: 'file',
						placeholder: 'Avatar'
					}
				},
				{
					type: 'input',
					props:
					{
						name: 'displayname',
						type: 'text',
						placeholder: 'Name'
					}
				},
				{
					type: 'input',
					props:
					{
						name: 'username',
						type: 'text',
						placeholder: 'Username'
					}
				},
				{
					type: 'input',
					props:
					{
						name: 'email',
						type: 'email',
						placeholder: 'E-Mail'
					}
				},
				{
					type: 'input',
					props:
					{
						name: 'password',
						type: 'password',
						placeholder: 'Password',
						withConfirm: true
					}
				},
				{
					type: 'input',
					props:
					{
						name: 'repeat-password',
						type: 'password',
						placeholder: 'Repeat Password'
					}
				},
				{
					type: 'input',
					props:
					{
						name: 'enableTwoFactor',
						type: 'checkbox',
						placeholder: 'Enable 2FA (Requires Mobile App)'
					}
				},
				{
					type: 'html',
					props: {
						html: this.renderTwoFactorHtml()
					}
				},
				{
					type: 'html',
					props:
					{
						html: `
							<p>Already have an account? <a router href="/login">log in</a></p>
							<div class="flex justify-center pt-2">
								<button id="google-signup" class="btn btn-google">Sign up with Google</button>
							</div>
						`
					}
				},
				{
					type: 'buttongroup',
					props:
					{
						layout: 'stack',
						align: 'center',
						buttons:
						[
							{
								id: 'submit-signup',
								text: 'Sign up',
								type: 'submit',
								className: 'btn btn-primary'
							}
						]
					}
				}
			]
		});

		return this.render(signupCard);
	}
}
