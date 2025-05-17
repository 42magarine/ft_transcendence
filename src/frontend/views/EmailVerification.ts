import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';

export default class EmailVerification extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const card = new Card();

        // Extract token from URL path since params doesn't seem to contain it
        const pathParts = window.location.pathname.split('/');
        const token = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;

        console.log("Token from path:", token);

        if (!token) {
            // No token provided, show instructions for verification
            const infoCard = await card.renderCard({
                title: 'Email Verification',
                prefix: `
                    <div class="text-center">
                        <p>Please check your email for a verification link.</p>
                        <p class="mt-4">If you haven't received an email, you can request a new verification link using the form below:</p>
                    </div>
                `,
                formId: 'resend-verification-form',
                inputs: [
                    { name: 'email', type: 'email', placeholder: 'Your Email Address' }
                ],
                button: { text: 'Resend Verification Email', type: 'submit', className: "btn btn-primary" },
                extra: '<p>Already verified? <a router href="/login">Log in</a></p>'
            });

            return this.render(`
                <div class="flex justify-center items-center min-h-[80vh] px-4">
                    <div class="w-full max-w-xl space-y-8">
                        ${infoCard}
                    </div>
                </div>
            `);
        } else {
            // Token provided, show verification in progress
            const verifyingCard = await card.renderCard({
                title: 'Verifying Your Email',
                prefix: `
                    <div class="text-center">
                        <p>Please wait while we verify your email address...</p>
                        <div class="mt-4">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                        </div>
                    </div>
                `,
                formId: '',
                inputs: [],
                button: { text: '', type: 'button', className: "btn btn-primary" }
            });

            return this.render(`
                <div class="flex justify-center items-center min-h-[80vh] px-4">
                    <div class="w-full max-w-xl space-y-8">
                        ${verifyingCard}
                    </div>
                </div>
            `);
        }
    }
}
