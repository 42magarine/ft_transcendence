import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';
import __ from "../services/LanguageService.js";

export default class Login extends AbstractView
{
	constructor()
    {
		super();
	}

	async getHtml(): Promise<string>
    {
		const card = new Card();

		const loginCard = await card.renderCard(
        {
			title: __('Login'),
			formId: 'login-form',
			contentBlocks:
            [
				{
					type: 'inputgroup',
					props:
					{
						inputs:
						[
							{
								name: 'email',
								type: 'text',
								placeholder: __('E-Mail')
							},
							{
								name: 'password',
								type: 'password',
								placeholder: __('Password')
							}
						]
					}
				},
				{
					type: 'buttongroup',
					props:
					{
						buttons:
						[
							{
								text: __('Login'),
								type: 'submit',
								className: 'btn btn-primary',
							},
							{
								id: 'signup-redirect',
								type: 'text-with-button',
								text: __('sign up'),
								textBefore: __('May want to'),
								href: '/signup',
								className: 'btn-link text-sm underline',
								align: 'center',
							},
							{
								id: 'reset-password',
								type: 'text-with-button',
								text: __('Reset Password'),
								textBefore: __('Did you forget your Password?'),
								href: '/password-reset',
								className: 'btn-link text-sm underline',
								align: 'center',
							},
							{
								id: 'google-signin',
								type: 'google-signin',
								align: 'center',
							}
						],
						layout: 'stack',
						align: 'center'
					}
				}
			]
		});

		return this.render(`${loginCard}`);
	}
}
