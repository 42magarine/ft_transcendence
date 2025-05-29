import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';

export default class Signup extends AbstractView
{
	constructor()
	{
		super();
	}

	async getHtml(): Promise<string>
	{
		const signupCard = await new Card().renderCard(
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
					type: 'twofactor',
					props: {}
				},					
				{
					type: 'signup-footer',
					props: {}
				}

			]
		});

		return this.render(signupCard);
	}
}
