import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';
import { LoginCredentials } from '../../interfaces/userManagementInterfaces.js';
import Modal from '../components/Modal.js';

export default class Login extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const loginCard = await new Card().renderCard({
            title: window.ls.__('Login'),
            formId: 'login-form',
            contentBlocks: [
                {
                    type: 'inputgroup',
                    props: {
                        inputs: [
                            { name: 'email', type: 'text', placeholder: window.ls.__('E-Mail') },
                            { name: 'password', type: 'password', placeholder: window.ls.__('Password') }
                        ]
                    }
                },
                {
                    type: 'buttongroup',
                    props: {
                        buttons: [
                            {
                                text: window.ls.__('Login'),
                                type: 'submit',
                                className: 'btn btn-primary',
                                aria: {
                                    description: 'Submit Login Form',
                                    describedby: 'login-form',
                                },
                            },
                            {
                                id: 'signup-redirect',
                                type: 'text-with-button',
                                text: window.ls.__('sign up'),
                                textBefore: window.ls.__('May want to'),
                                href: '/signup',
                                className: 'underline text-btn',
                                align: 'center',
                            },
                            {
                                id: 'reset-password',
                                type: 'text-with-button',
                                text: window.ls.__('Reset Password'),
                                textBefore: window.ls.__('Did you forget your Password?'),
                                href: '/password-reset',
                                className: 'underline text-btn',
                                align: 'center',
                            },
                            {
                                id: 'google-signin',
                                type: 'google-signin',
                                align: 'center',
                            }
                        ],
                        layout: 'stack',
                        align: 'center',
                    }
                }
            ]
        });
        return this.render(`${loginCard}`);
    }

    async mount(): Promise<void> {
        const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const formData = new FormData(loginForm);
                const credentials: LoginCredentials = {
                    email: formData.get('email') as string,
                    password: formData.get('password') as string,
                };

                await window.userManagementService.login(credentials);
                loginForm.reset();
            }
            catch (error) {
                const resendBtnId = 'resend-verification-btn';

                // Remove existing modal if present
                document.getElementById('login-error')?.remove();

                const modalHtml = await new Modal().renderModal({
                    id: 'login-error',
                    title: window.ls.__('Login Failed'),
                    content: `
						<p>${error instanceof Error ? error.message : 'An unknown error occurred during login.'}</p>
						<p class="mt-4">${window.ls.__('What would you like to do?')}</p>
					`,
                    footerButtons: [
                        {
                            id: 'reset-password-btn',
                            text: window.ls.__('Forgot Password?'),
                            className: 'btn btn-secondary',
                            onClick: `window.location.href='/password-reset'`
                        },
                        {
                            id: resendBtnId,
                            text: window.ls.__('Resend Verification Email'),
                            className: 'btn btn-blue'
                        }
                    ],
                    closableOnOutsideClick: true,
                    showCloseButton: true
                });

                const container = document.createElement('div');
                container.innerHTML = modalHtml;
                document.body.appendChild(container);

                document.getElementById('login-error')?.classList.remove('hidden');

                // Event listener for resend verification
                document.getElementById(resendBtnId)?.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(loginForm);
                    const email = formData.get('email') as string;
                    if (!email) return;

                    try {
                        await window.userManagementService.resendVerificationEmail(email);
                        await new Modal().renderInfoModal({
                            id: 'resend-success',
                            title: window.ls.__('Email Sent'),
                            message: window.ls.__('Verification email resent successfully.')
                        });
                    } catch (err) {
                        await new Modal().renderInfoModal({
                            id: 'resend-error',
                            title: window.ls.__('Error'),
                            message: window.ls.__('There was a problem resending the verification email. Please try again later or contact support.'),
                        });
                    }
                });
            }
        });
    }
}
