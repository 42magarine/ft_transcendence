import Card from '../components/Card.js';
import Input from '../components/Input.js';
import AbstractView from '../../utils/AbstractView.js';
import Router from '../../utils/Router.js';

export default class TwoFactorLogin extends AbstractView
{
	constructor()
	{
		super();
	}

	private async renderTwoFactorInputFields(username: string): Promise<string>
	{
		const input = new Input();
		const renderedGroup = await input.renderNumericGroup(6, 'tf');

		return `
			<div id="twoFactorInterfaceLogin" class="mb-6">
				<h3 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
					Enter the 6-digit code from your authenticator app
				</h3>
				<p class="mb-4 text-gray-600 dark:text-gray-400">
					User: <strong id="tf-username-display">${username}</strong>
				</p>
				${renderedGroup}
			</div>
		`;
	}

	async getHtml(): Promise<string>
	{
		const userId = sessionStorage.getItem('pendingUserId');
		const username = sessionStorage.getItem('pendingUsername');

		if (!userId || !username)
		{
			Router.redirect('/login');
			return '';
		}

		const card = new Card();

		const twoFactorCard = await card.renderCard(
		{
			title: 'Two-Factor Authentication',
			formId: 'TwoFactorLogin-form',
			contentBlocks:
			[
				{
					type: 'html',
					props:
					{
						html: await this.renderTwoFactorInputFields(username)
					}
				},
				{
					type: 'inputgroup',
					props:
					{
						inputs:
						[
							{
								name: 'username',
								type: 'hidden', value: username
							},
							{
								name: 'userId',
								type: 'hidden', value: userId
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
								text: 'Verify',
								type: 'submit',
								className: 'btn btn-primary w-full'
							}
						],
						align: 'center',
						layout: 'stack'
					}
				}
			],
			extra: `
				<p class="mt-4 text-center text-gray-600 dark:text-gray-400">
					Open your authenticator app to view your verification code.
				</p>
			`
		});

		return this.render(`${twoFactorCard}`);
	}
}
