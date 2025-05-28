import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';

export default class PasswordReset extends AbstractView
{
    constructor(params: URLSearchParams)
    {
        super();
        this.params = params;
    }

    public params: URLSearchParams;

    async getHtml(): Promise<string>
    {
        const card = new Card();

        let token = this.params.get('token');

        if (!token)
        {
            const pathParts = window.location.pathname.split('/');
            token = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;
        }

        if (token)
        {
            try
            {
                await window.userManagementService.verifyPasswordResetToken(token);

                const resetCard = await card.renderCard(
                {
                    title: 'Reset Your Password',
                    formId: 'password-reset-form',
                    inputs:
                    [
                        {
                            name: 'password',
                            type: 'password',
                            placeholder: 'New Password' },
                        {
                            name: 'confirmPassword',
                            type: 'password',
                            placeholder: 'Confirm New Password' }
                    ],
                    buttonGroup:
                    [
                        {
                            text: 'Reset Password',
                            type: 'submit',
                            className: "btn btn-primary",
                        },
                        {
                            id: 'login-redirect',
                            type: 'text-with-button',
                            text: 'Log in',
                            textBefore: 'Remember your password?',
                            href: '/login',
                            className: 'btn-link text-sm underline',
                            align: 'center',
                        }
                    ]
                });

                return this.render(`${resetCard}`);
            }
            catch (error)
            {
                const errorCard = await card.renderCard(
                {
                    title: 'Invalid or Expired Link',
                    prefix: '<p class="text-red-500">This password reset link is invalid or has expired.</p>',
                    formId: '',
                    inputs: [],
                    buttonGroup:
                    [
                        { 
                            text: '',
                            type: 'button',
                            className: 'hidden'
                        },
                        {
                            id: 'reset-request',
                            type: 'text-with-button',
                            text: 'password reset page',
                            textBefore: 'Please request a new password reset link from the',
                            href: '/password-reset',
                            className: 'btn-link text-sm underline',
                            align: 'center'
                        }
                    ]
                });
                return this.render(` ${errorCard} `);
            }
        }
        else
        {
            const requestCard = await card.renderCard({
                title: 'Password Reset',
                formId: 'password-reset-request-form',
                inputs:
                [
                    {
                        name: 'email',
                        type: 'email',
                        placeholder: 'E-Mail' }
                ],
                buttonGroup:
                [
                    {
                        text: 'Request Password Reset', type: 'submit', className: "btn btn-primary",
                    },
                    {
                        id: 'login-redirect',
                        type: 'text-with-button',
                        text: 'Log in',
                        textBefore: 'Remember your password?',
                        href: '/login',
                        className: 'btn-link text-sm underline',
                        align: 'center'
                    }
                ]
            });

            return this.render(`${requestCard}`);
        }
    }
}
