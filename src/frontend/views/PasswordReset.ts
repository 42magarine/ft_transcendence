import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';

export default class PasswordReset extends AbstractView {
    constructor(params: URLSearchParams) {
        super();
        this.params = params;
    }

    public params: URLSearchParams;

    async getHtml(): Promise<string> {
        let token = this.params.get('token');

        if (!token) {
            const pathParts = window.location.pathname.split('/');
            token = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;
        }

        if (token) {
            try {
                await window.userManagementService.verifyPasswordResetToken(token);

                const resetCard = await new Card().renderCard({
                    title: window.ls.__('Reset Your Password'),
                    formId: 'password-reset-form',
                    inputs: [
                        {
                            name: 'password',
                            type: 'password',
                            placeholder: window.ls.__('New Password')
                        },
                        {
                            name: 'confirmPassword',
                            type: 'password',
                            placeholder: window.ls.__('Confirm New Password')
                        }
                    ],
                    buttonGroup: [
                        {
                            text: window.ls.__('Reset Password'),
                            type: 'submit',
                            className: "btn btn-primary",
                        },
                        {
                            id: 'login-redirect',
                            type: 'text-with-button',
                            text: window.ls.__('Log in'),
                            textBefore: window.ls.__('Remember your password?'),
                            href: '/login',
                            className: 'underline',
                            align: 'center',
                        }
                    ]
                });

                return this.render(`${resetCard}`);
            } catch (error) {
                const errorCard = await new Card().renderCard({
                    title: window.ls.__('Invalid or Expired Link'),
                    prefix: `<p class="text-red-500">${window.ls.__('This password reset link is invalid or has expired.')}</p>`,
                    formId: '',
                    inputs: [],
                    buttonGroup: [
                        {
                            text: '',
                            type: 'button',
                            className: 'hidden'
                        },
                        {
                            id: 'reset-request',
                            type: 'text-with-button',
                            text: window.ls.__('password reset page'),
                            textBefore: window.ls.__('Please request a new password reset link from the'),
                            href: '/password-reset',
                            className: 'underline',
                            align: 'center'
                        }
                    ]
                });
                return this.render(`${errorCard}`);
            }
        } else {
            const requestCard = await new Card().renderCard({
                title: window.ls.__('Password Reset'),
                formId: 'password-reset-request-form',
                inputs: [
                    {
                        name: 'email',
                        type: 'email',
                        placeholder: window.ls.__('E-Mail')
                    }
                ],
                buttonGroup: [
                    {
                        text: window.ls.__('Request Password Reset'),
                        type: 'submit',
                    },
                    {
                        id: 'login-redirect',
                        type: 'text-with-button',
                        text: window.ls.__('Log in'),
                        textBefore: window.ls.__('Remember your password?'),
                        href: '/login',
                        className: 'underline',
                        align: 'center'
                    }
                ]
            });

            return this.render(`${requestCard}`);
        }
    }
}
