import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';
import Router from '../../utils/Router.js';

export default class TwoFactorLogin extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const userId = sessionStorage.getItem('pendingUserId');
        const username = sessionStorage.getItem('pendingUsername');

        if (!userId || !username) {
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
                            type: 'twofactor',
                            props:
                            {
                                namePrefix: 'tf'
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
