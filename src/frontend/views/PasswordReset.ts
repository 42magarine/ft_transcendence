import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';
import Modal from "../components/Modal.js";

export default class PasswordReset extends AbstractView {
    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
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
                    contentBlocks: [
                        {
                            type: 'input',
                            props: {
                                name: 'password',
                                type: 'password',
                                placeholder: window.ls.__('New Password')
                            }
                        },
                        {
                            type: 'input',
                            props: {
                                name: 'confirmPassword',
                                type: 'password',
                                placeholder: window.ls.__('Confirm New Password')
                            }
                        },
                        {
                            type: 'buttongroup',
                            props: {
                                buttons: [
                                    {
                                        text: window.ls.__('Reset Password'),
                                        id: 'reset-password',
                                        icon: 'fa-key',
                                        className: 'btn btn-primary',
                                        type: 'button'
                                    }
                                ],
                                align: 'center'
                            }
                        },
                        {
                            type: 'button',
                            props: {
                                id: 'login-redirect',
                                type: 'text-with-button',
                                text: window.ls.__('Log in'),
                                textBefore: window.ls.__('Remember your password?'),
                                href: '/login',
                                className: 'underline',
                                align: 'center'
                            }
                        }
                    ]
                });
    
                return this.render(`${resetCard}`);
            } catch (error) {
                const errorCard = await new Card().renderCard({
                    title: window.ls.__('Invalid or Expired Link'),
                    prefix: `<p class="text-red-500">${window.ls.__('This password reset link is invalid or has expired.')}</p>`,
                    formId: '',
                    contentBlocks: [
                        {
                            type: 'button',
                            props: {
                                id: 'reset-request',
                                type: 'text-with-button',
                                text: window.ls.__('password reset page'),
                                textBefore: window.ls.__('Please request a new password reset link from the'),
                                href: '/password-reset',
                                className: 'underline',
                                align: 'center'
                            }
                        }
                    ]
                });
                return this.render(`${errorCard}`);
            }
        } else {
            const requestCard = await new Card().renderCard({
                title: window.ls.__('Password Reset'),
                formId: 'password-reset-request-form',
                contentBlocks: [
                    {
                        type: 'input',
                        props: {
                            name: 'email',
                            type: 'email',
                            placeholder: window.ls.__('E-Mail')
                        }
                    },
                    {
                        type: 'buttongroup',
                        props: {
                            buttons: [
                                {
                                    id: 'request-reset',
                                    icon: 'fa-paper-plane',
                                    text: window.ls.__('Request Password Reset'),
                                    type: 'button',
                                    className: 'btn'
                                }
                            ],
                            align: 'center'
                        }
                    },
                    {
                        type: 'button',
                        props: {
                            id: 'login-redirect',
                            type: 'text-with-button',
                            text: window.ls.__('Log in'),
                            textBefore: window.ls.__('Remember your password?'),
                            href: '/login',
                            className: 'underline',
                            align: 'center'
                        }
                    }
                ]
            });
    
            return this.render(`${requestCard}`);
        }

        
    }
    async mount(): Promise<void> {
        const passwordResetForm = document.getElementById('password-reset-form') as HTMLFormElement | null;
        const resetButton = document.getElementById('reset-password');
        const requestButton = document.getElementById('request-reset');
        const requestForm = document.getElementById('password-reset-request-form') as HTMLFormElement | null;
    
        // ✅ Handle password reset form with token
        if (passwordResetForm && resetButton) {
            resetButton.addEventListener('click', async () => {
                const formData = new FormData(passwordResetForm);
                const password = formData.get('password') as string;
                const confirmPassword = formData.get('confirmPassword') as string;
    
                if (!password || !confirmPassword) {
                    await new Modal().renderInfoModal({
                        id: 'missing-password',
                        title: window.ls.__('Incomplete'),
                        message: window.ls.__('Please fill in both password fields.')
                    });
                    return;
                }
    
                if (password !== confirmPassword) {
                    await new Modal().renderInfoModal({
                        id: 'mismatch',
                        title: window.ls.__('Mismatch'),
                        message: window.ls.__('Passwords do not match.')
                    });
                    return;
                }
    
                const token = this.params.get('token') || window.location.pathname.split('/').pop();

                if (!token) {
                    await new Modal().renderInfoModal({
                        id: 'missing-token',
                        title: window.ls.__('Missing Token'),
                        message: window.ls.__('Your password reset link is invalid. Please try requesting a new one.')
                    });
                    return;
                }
                try {
                    await window.userManagementService.resetPassword(token, password, confirmPassword);
                    await new Modal().renderInfoModal({
                        id: 'success',
                        title: window.ls.__('Password Changed'),
                        message: window.ls.__('Your password has been successfully updated.'),
                    });
                    window.location.href = '/login';
                } catch (error) {
                    await new Modal().renderInfoModal({
                        id: 'fail',
                        title: window.ls.__('Error'),
                        message: window.ls.__('Something went wrong while resetting your password.')
                    });
                }
            });
        }
    
        // ✅ Handle password reset request (email only)
        if (requestForm && requestButton) {
            requestButton.addEventListener('click', async () => {
                const formData = new FormData(requestForm);
                const email = formData.get('email') as string;
    
                if (!email) {
                    await new Modal().renderInfoModal({
                        id: 'missing-email',
                        title: window.ls.__('Missing Email'),
                        message: window.ls.__('Please enter your email.')
                    });
                    return;
                }
    
                try {
                    await window.userManagementService.requestPasswordReset(email);
                    await new Modal().renderInfoModal({
                        id: 'email-sent',
                        title: window.ls.__('Email Sent'),
                        message: window.ls.__('A password reset link has been sent to your email.')
                    });
                    requestForm.reset();
                } catch (error) {
                    await new Modal().renderInfoModal({
                        id: 'email-failed',
                        title: window.ls.__('Failed'),
                        message: window.ls.__('Could not send the reset email. Please try again.')
                    });
                }
            });
        }
    }
} 
