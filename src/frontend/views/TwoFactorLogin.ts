import AbstractView from '../../utils/AbstractView.js';
import Router from '../../utils/Router.js';
import Card from '../components/Card.js';
import Modal from '../components/Modal.js';

export default class TwoFactorLogin extends AbstractView {
    private userId = sessionStorage.getItem('pendingUserId');
    private username = sessionStorage.getItem('pendingUsername');

    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        if (!this.userId || !this.username) {
            Router.redirect('/login');
            return '';
        }

        const twoFactorCard = await new Card().renderCard({
            title: window.ls.__('Two-Factor Authentication'),
            formId: 'TwoFactorLogin-form',
            prefix: `<p class="text-center text-gray-600 dark:text-gray-400 mb-4">${window.ls.__('Welcome back')}, ${this.username}!</p>`,
            contentBlocks: [
                {
                    type: 'twofactor',
                },
                {
                    type: 'buttongroup',
                    props: {
                        buttons: [
                            {
                                text: window.ls.__('Verify'),
                                type: 'submit',
                                className: 'btn btn-primary w-full'
                            }
                        ],
                        align: 'center',
                        layout: 'stack'
                    }
                }
            ]
        });
        return this.render(`${twoFactorCard}`);
    }

    async mount(): Promise<void> {
        this.setupTwoFactorForm();
        this.setupNumericInputs();
    }

    private setupTwoFactorForm(): void {
        try {
            const form = document.getElementById('TwoFactorLogin-form') as HTMLFormElement | null;
            if (!form) {
                throw new Error('Two-factor form element not found.');
            }

            const twoFactorInterface = document.getElementById("twoFactorInterface");
            if (twoFactorInterface) {
                twoFactorInterface.classList.remove('hidden');
                twoFactorInterface.style.display = 'block';

                const qrDisplay = document.getElementById("qr-display");
                if (qrDisplay) {
                    qrDisplay.classList.add('hidden');
                    qrDisplay.style.display = 'none';
                    qrDisplay.innerHTML = '';
                }
            }

            form.addEventListener('submit', async (e: Event) => {
                e.preventDefault();

                const formData = new FormData(form);
                const getStr = (key: string) => String(formData.get(key) || '');

                // Validate that all 6 digits are entered
                const tfFields = ['tf_one', 'tf_two', 'tf_three', 'tf_four', 'tf_five', 'tf_six'];
                const missing = tfFields.some(name => {
                    const val = formData.get(name) as string;
                    return !val || val.trim() === '';
                });

                if (missing) {
                    await new Modal().renderInfoModal({
                        id: 'incomplete-2fa',
                        title: window.ls.__('Missing Code'),
                        message: window.ls.__('Please enter all 6 digits of your 2FA code.')
                    });
                    return;
                }

                try {
                    // Collect the 2FA code
                    const twoFactorCode = tfFields.map(field => getStr(field)).join('');
                    const userId = parseInt(this.userId!);

                    // Call your authentication service
                    const result = await window.userManagementService.verifyTwoFactor(userId, twoFactorCode);

                    if (result) {
                        // Clear pending session data
                        sessionStorage.removeItem('pendingUserId');
                        sessionStorage.removeItem('pendingUsername');

                        // Redirect to homepage
                        Router.redirect('/');
                    }

                }
                catch (error) {
                    await new Modal().renderInfoModal({
                        id: 'twofactor-failed',
                        title: window.ls.__('Verification Failed'),
                        message: window.ls.__('Invalid verification code. Please try again.')
                    });

                    // Clear the form inputs
                    form.reset();
                    // tfFields.forEach(field => {
                    //     const input = form.querySelector(`input[name="${field}"]`) as HTMLInputElement;
                    //     if (input) {
                    //         input.value = '';
                    //     }
                    // });

                    // Focus on first input
                    const firstInput = form.querySelector('input[name="tf_one"]') as HTMLInputElement;
                    if (firstInput) {
                        firstInput.focus();
                    }
                }
            });
        }
        catch (error) {
            new Modal().renderInfoModal({
                id: 'twofactor-setup-error',
                title: window.ls.__('Setup Error'),
                message: `${window.ls.__('An unexpected error occurred while setting up the form.')}\n\n${(error as Error).message}`
            });
        }
    }

    private setupNumericInputs(): void {
        // Add auto-focus and navigation between numeric inputs
        const inputs = document.querySelectorAll('.tf_numeric') as NodeListOf<HTMLInputElement>;
        const form = document.getElementById('TwoFactorLogin-form') as HTMLFormElement;

        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                const value = target.value;

                // Only allow single digit
                if (value.length > 1) {
                    target.value = value.slice(-1);
                }

                // Move to next input if value entered
                if (value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });

            input.addEventListener('keydown', (e) => {
                const target = e.target as HTMLInputElement;

                // Handle Enter key
                if (e.key === 'Enter') {
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    e.preventDefault();
                    return;
                }

                // Handle backspace
                if (e.key === 'Backspace' && !target.value && index > 0) {
                    inputs[index - 1].focus();
                    return;
                }

                // Only allow numeric input
                if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab'].includes(e.key)) {
                    e.preventDefault();
                }
            });
        });

        // Focus on first input when page loads
        if (inputs.length > 0) {
            inputs[0].focus();
        }
    }
}
