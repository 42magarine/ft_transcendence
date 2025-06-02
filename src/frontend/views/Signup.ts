import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';

export default class Signup extends AbstractView {
	constructor() {
		super();
	}

	async getHtml(): Promise<string> {
		const signupCard = await new Card().renderCard({
			title: 'Signup',
			formId: 'signup-form',
			prefix: '<div class="signup-avatar"></div>',
			contentBlocks: [
				{
					type: 'inputgroup',
					props: {
						inputs: [
							{
								name: 'avatar',
								type: 'file',
								label: 'Avatar',
								placeholder: 'Upload an avatar'
							},
							{
								name: 'displayname',
								type: 'text',
								label: 'Name',
								placeholder: 'Your name'
							},
							{
								name: 'username',
								type: 'text',
								label: 'Username',
								placeholder: 'Your username'
							},
							{
								name: 'email',
								type: 'email',
								label: 'E-Mail',
								placeholder: 'Your email address'
							},
							{
								name: 'password',
								type: 'password',
								label: 'Password',
								placeholder: 'Choose a password',
								withConfirm: true
							},
							{
								name: 'repeat-password',
								type: 'password',
								label: 'Repeat Password',
								placeholder: 'Confirm your password'
							},
							{
								name: 'enableTwoFactor',
								type: 'checkbox',
								label: 'Enable 2FA',
								placeholder: 'Enable 2FA (Requires Mobile App)'
							}
						]
					}
				},
				{
					type: 'twofactor',
					props: {}
				},
				{
					type: 'buttongroup',
					props: {
						buttons: [
							{
								text: 'Create Account',
								className: 'btn btn-green'
							}
						],
						layout: 'stack',
						align: 'left'
					}
				}
			]
		});

		return this.render(signupCard);
	}
}
