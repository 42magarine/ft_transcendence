import Card from '../components/Card.js';
import Button from '../components/Button.js';
import AbstractView from '../../utils/AbstractView.js';
import Router from '../../utils/Router.js';

export default class TwoFactorLogin extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        // Check if we have pending 2FA data
        const userId = sessionStorage.getItem('pendingUserId');
        const username = sessionStorage.getItem('pendingUsername');

        if (!userId || !username) {
            // Redirect to login if no pending verification
            Router.redirect('/login');
            return '';
        }

        const button = new Button();

        const twoFactorInterfaceLogin = `
			<div id="twoFactorInterfaceLogin" class="mb-6">
				<h3 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
					Enter the 6-digit code from your authenticator app
				</h3>
				<p class="mb-4 text-gray-600 dark:text-gray-400">
					User: <strong>${username}</strong>
				</p>
				<div id="tf-code" class="flex justify-center space-x-2">
					<input type="number" id="tf_one" name="tf_one" value="" placeholder="" min="0" max="9" class="tf_numeric w-12 h-12 text-center text-xl border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" >
					<input type="number" id="tf_two" name="tf_two" value="" placeholder="" min="0" max="9" class="tf_numeric w-12 h-12 text-center text-xl border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" >
					<input type="number" id="tf_three" name="tf_three" value="" placeholder="" min="0" max="9" class="tf_numeric w-12 h-12 text-center text-xl border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" >
					<div class="spacer w-4"></div>
					<input type="number" id="tf_four" name="tf_four" value="" placeholder="" min="0" max="9" class="tf_numeric w-12 h-12 text-center text-xl border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" >
					<input type="number" id="tf_five" name="tf_five" value="" placeholder="" min="0" max="9" class="tf_numeric w-12 h-12 text-center text-xl border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" >
					<input type="number" id="tf_six" name="tf_six" value="" placeholder="" min="0" max="9" class="tf_numeric w-12 h-12 text-center text-xl border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" >
				</div>
			</div>`;

        const card = new Card();
        const TwoFactorLoginCard = await card.renderCard({
            title: 'Two-Factor Authentication',
            formId: 'TwoFactorLogin-form',
            inputs: [
                { name: 'username', type: 'hidden', placeholder: 'Username', value: username },
                { name: 'userId', type: 'hidden', placeholder: 'User ID', value: userId }
            ],
            preButton: twoFactorInterfaceLogin,
            button: { text: 'Verify', type: 'submit', className: "btn btn-primary w-full" },
            extra: '<p class="mt-4 text-center text-gray-600 dark:text-gray-400">Open your authenticator app to view your verification code.</p>'
        });

        return this.render(`
			<div class="flex justify-center items-center min-h-[80vh] px-4">
				<div class="w-full max-w-xl space-y-8">
					${TwoFactorLoginCard}
				</div>
			</div>
		`);
    }
}
