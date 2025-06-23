import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Modal from "../components/Modal.js";

export default class EmailVerification extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const pathParts = window.location.pathname.split('/');
        const token = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;

        if (!token) {
            const infoCard = await new Card().renderCard({
                title: window.ls.__('Email Verification'),
                formId: 'resend-verification-form',
                contentBlocks: [
                    {
                        type: 'html',
                        props: {
                            html: `
                                <div class="text-center">
                                    <p>${window.ls.__('Please check your email for a verification link.')}</p>
                                    <p class="mt-4">${window.ls.__('If you haven\'t received an email, you can request a new verification link using the form below:')}</p>
                                </div>
                            `
                        }
                    },
                    {
                        type: 'input',
                        props: {
                            name: 'email',
                            type: 'email',
                            placeholder: window.ls.__('Your Email Address')
                        }
                    },
                    {
                        type: 'html',
                        props: {
                            html: `<p>${window.ls.__('Already verified?')} <a router href="/login">${window.ls.__('Log in')}</a></p>`
                        }
                    },
                    {
                        type: 'button',
                        props: {
                            text: window.ls.__('Resend Verification Email'),
                            type: 'submit',
                            className: 'btn btn-primary'
                        }
                    }
                ]
            });

            return this.render(`${infoCard}`);
        } else {
            const verifyingCard = await new Card().renderCard({
                title: window.ls.__('Verifying Your Email'),
                contentBlocks: [
                    {
                        type: 'html',
                        props: {
                            html: `
                                <div class="text-center">
                                    <p>${window.ls.__('Please wait while we verify your email address...')}</p>
                                    <div class="mt-4">
                                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                                    </div>
                                </div>
                            `
                        }
                    },
                    {
                        type: 'button',
                        props: {
                            type: 'button',
                            className: 'btn btn-primary hidden'
                        }
                    }
                ]
            });

            return this.render(`${verifyingCard}`);
        }
    }

    async mount(): Promise<void> {
        const resendForm = document.getElementById('resend-verification-form') as HTMLFormElement | null;
    
        if (resendForm) {
            resendForm.addEventListener('submit', async (e) => {
                e.preventDefault();
    
                const formData = new FormData(resendForm);
                const email = formData.get('email');
    
                if (!email) return;
    
                try {
                    const response = await window.userManagementService.resendVerificationEmail(email as string);
                    alert(response.message || 'If your account exists, a verification email has been sent.');
                }
                catch (error) {
                    await new Modal().renderInfoModal({
                        id: 'resend-verification-failed',
                        title: 'Verification Error',
                        message: 'Failed to resend verification email. Please try again later.',
                    });
                }
                
            });
        }
    
        // Handle automatic verification from URL token
        const token = window.location.pathname.split('/').pop();
        if (token && token.length > 10) {
            try {
                const success = await window.userManagementService.verifyEmail(token);
                if (success) {
                    window.location.href = '/login?verified=true';
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Email verification failed';
                await new Modal().renderInfoModal({
                    id: 'email-verification-failed',
                    title: window.ls.__('Verification Failed'),
                    message: `
                        ${window.ls.__(errorMessage)}<br><br>
                        ${window.ls.__('You can try the following:')}<br>
                        • ${window.ls.__('Check if you clicked the correct link from your email')}<br>
                        • ${window.ls.__('Request a new verification email')}<br>
                        • ${window.ls.__('Contact support if the problem persists')}
                    `
                });
            }
            
        }
    }    
}
