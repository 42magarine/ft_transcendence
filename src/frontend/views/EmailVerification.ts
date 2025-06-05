import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';

export default class EmailVerification extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const pathParts = window.location.pathname.split('/');
        const token = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;

        if (!token) {
            const infoCard = await new Card().renderCard(
                {
                    title: 'Email Verification',
                    formId: 'resend-verification-form',
                    contentBlocks:
                        [
                            {
                                type: 'html',
                                props:
                                {
                                    html: `
                                <div class="text-center">
                                    <p>Please check your email for a verification link.</p>
                                    <p class="mt-4">If you haven't received an email, you can request a new verification link using the form below:</p>
                                </div>
                            `
                                }
                            },
                            {
                                type: 'input',
                                props: {
                                    name: 'email',
                                    type: 'email',
                                    placeholder: 'Your Email Address'
                                }
                            },
                            {
                                type: 'html',
                                props: {
                                    html: `<p>Already verified? <a router href="/login">Log in</a></p>`
                                }
                            },
                            {
                                type: 'button',
                                props:
                                {
                                    text: 'Resend Verification Email',
                                    type: 'submit',
                                    className: 'btn btn-primary'
                                }
                            }
                        ],
                });

            return this.render(`${infoCard}`);
        }
        else {
            const verifyingCard = await new Card().renderCard({
                title: 'Verifying Your Email',
                contentBlocks:
                    [
                        {
                            type: 'html',
                            props:
                            {
                                html: `
                                <div class="text-center">
                                    <p>Please wait while we verify your email address...</p>
                                    <div class="mt-4">
                                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                                    </div>
                                </div>
                            `
                            }
                        },
                        {
                            type: 'button',
                            props:
                            {
                                type: 'button',
                                className: 'btn btn-primary hidden'
                            }
                        }
                    ]
            });

            return this.render(`${verifyingCard}`);
        }
    }
}
