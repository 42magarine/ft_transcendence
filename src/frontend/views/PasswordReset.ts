import Card from '../components/Card.js';
import Button from '../components/Button.js';
import AbstractView from '../../utils/AbstractView.js';

export default class PasswordReset extends AbstractView {
    constructor(params: URLSearchParams) {
        super();
        this.params = params;
    }

    public params: URLSearchParams;

    async getHtml(): Promise<string> {
        const button = new Button();
        const card = new Card();

        // Extract token from URL params first
        let token = this.params.get('token');

        // If not in params, try to extract from URL path
        if (!token) {
            const pathParts = window.location.pathname.split('/');
            token = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;
        }

        // If we have a token, show the reset form, otherwise show the request form
        if (token) {
            // First verify the token is valid
            try {
                await window.userManagementService.verifyPasswordResetToken(token);

                const resetCard = await card.renderCard({
                    title: 'Reset Your Password',
                    formId: 'password-reset-form',
                    inputs: [
                        { name: 'password', type: 'password', placeholder: 'New Password' },
                        { name: 'confirmPassword', type: 'password', placeholder: 'Confirm New Password' }
                    ],
                    button: { text: 'Reset Password', type: 'submit', className: "btn btn-primary" },
                    extra: '<p>Remember your password? <a router href="/login">Log in</a></p>'
                });

                return this.render(`
                    <div class="flex justify-center items-center min-h-[80vh] px-4">
                        <div class="w-full max-w-xl space-y-8">
                            ${resetCard}
                        </div>
                    </div>
                `);
            } catch (error) {
                // Invalid or expired token
                const errorCard = await card.renderCard({
                    title: 'Invalid or Expired Link',
                    prefix: '<p class="text-red-500">This password reset link is invalid or has expired.</p>',
                    formId: '',
                    inputs: [],
                    button: { text: '', type: 'button', className: "btn btn-primary" },
                    extra: '<p>Please request a new password reset link from the <a router href="/password-reset">password reset page</a>.</p>'
                });

                return this.render(`
                    <div class="flex justify-center items-center min-h-[80vh] px-4">
                        <div class="w-full max-w-xl space-y-8">
                            ${errorCard}
                        </div>
                    </div>
                `);
            }
        } else {
            // Show the request password reset form
            const requestCard = await card.renderCard({
                title: 'Password Reset',
                formId: 'password-reset-request-form',
                inputs: [
                    { name: 'email', type: 'email', placeholder: 'E-Mail' }
                ],
                button: { text: 'Request Password Reset', type: 'submit', className: "btn btn-primary" },
                extra: '<p>Remember your password? <a router href="/login">Log in</a></p>'
            });

            // Return without any inline scripts
            return this.render(`
                <div class="flex justify-center items-center min-h-[80vh] px-4">
                    <div class="w-full max-w-xl space-y-8">
                        ${requestCard}
                    </div>
                </div>
            `);
        }
    }
}
