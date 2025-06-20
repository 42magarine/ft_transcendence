import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Modal from '../components/Modal.js';
import __ from '../services/LanguageService.js';
import Router from '../../utils/Router.js';
import { generateTextVisualization } from '../../utils/Avatar.js';
import { User } from '../../interfaces/userManagementInterfaces.js';
export default class Signup extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const signupCard = await new Card().renderCard({
            title: window.ls.__('Signup'),
            formId: 'signup-form',
            prefix: '<div class="signup-avatar flex justify-center mb-4"></div>',
            contentBlocks: [
                {
                    type: 'inputgroup',
                    props: {
                        inputs: [
                            { name: 'avatar', type: 'file', placeholder: window.ls.__('Avatar') },
                            { name: 'name', type: 'text', placeholder: window.ls.__('Name') },
                            { name: 'username', type: 'text', placeholder: window.ls.__('Username') },
                            { name: 'email', type: 'email', placeholder: window.ls.__('E-Mail') },
                            { name: 'password', type: 'password', placeholder: window.ls.__('Password'), withConfirm: true }
                        ]
                    }
                },
                {
                    type: 'toggle',
                    props: {
                        id: 'enableTwoFactor',
                        name: 'enableTwoFactor',
                        label: window.ls.__('Enable 2FA (Requires Mobile App)'),
                        checked: false
                    }
                },
                {
                    type: 'twofactor',
                    props: {}
                },
                {
                    type: 'buttongroup',
                    props: {
                        layout: 'stack',
                        align: 'center',
                        buttons: [
                            {
                                text: window.ls.__('Sign up'),
                                type: 'submit',
                                className: 'btn btn-primary'
                            },
                            {
                                id: 'login-redirect',
                                type: 'text-with-button',
                                text: window.ls.__('Login'),
                                textBefore: window.ls.__('Already have an account?'),
                                href: '/login',
                                align: 'center'
                            }
                        ]
                    }
                }
            ]
        });

        return this.render(signupCard);
    }

    async mount(): Promise<void> {
        this.setupSignupForm();
    }

    private setupSignupForm(): void {
        try {
            const form = document.getElementById('signup-form') as HTMLFormElement | null;
            if (!form) {
                throw new Error('Signup form element not found.');
            }
            const enableTwoFactor = form.querySelector("input[name=enableTwoFactor]") as HTMLInputElement | null;
            const twoFactorInterface = document.getElementById("twoFactorInterface");
            const qrDisplay = document.getElementById("qr-display");
            const secHidden = form.querySelector("input[type=hidden][name=secret]") as HTMLInputElement | null;
            const usernameInput = form.querySelector('input[name="username"]') as HTMLInputElement;
            const avatarInput = form.querySelector('input[name="avatar"]') as HTMLInputElement;
            const signupAvatar = form.querySelector('.signup-avatar');
            if (!signupAvatar) {
                throw new Error('Signup avatar container not found.');
            }

            // 2FA QR logic
            if (enableTwoFactor && twoFactorInterface && qrDisplay && secHidden) {
                enableTwoFactor.addEventListener("change", async (e: Event) => {
                    const checkbox = e.target as HTMLInputElement;
                    if (checkbox.checked) {
                        twoFactorInterface.classList.remove('hidden');
                        twoFactorInterface.style.display = 'block';

                        try {
                            const response = await fetch('/api/generate-qr');
                            if (!response.ok) {
                                throw new Error(`QR API error: ${response.status}`);
                            }

                            const qr_response = await response.json();
                            const qr_alt_text = window.ls.__("QR Code for 2FA");
                            qrDisplay.innerHTML = `<img alt="${qr_alt_text}" src="${qr_response.qr}" />`;
                            secHidden.value = qr_response.secret;
                        }
                        catch (error) {
                            console.error('[2FA] Failed to fetch QR:', error);
                        }
                    }
                    else {
                        twoFactorInterface.classList.add('hidden');
                        twoFactorInterface.style.display = 'none';
                        qrDisplay.innerHTML = '';
                        secHidden.value = '';
                    }
                });
            }

            if (usernameInput && avatarInput) {
                usernameInput.addEventListener('input', () => {
                    if (!avatarInput.value) {
                        const seedSvg = generateTextVisualization(usernameInput.value, {
                            width: 100,
                            height: 100,
                            useShapes: true,
                            maxShapes: 50,
                            showText: false,
                            backgroundColor: '#f0f0f0'
                        });
                        signupAvatar.innerHTML = seedSvg;
                    }
                });
            }

            if (avatarInput) {
                avatarInput.setAttribute('accept', 'image/jpeg, image/png');

                avatarInput.addEventListener('change', async function () {
                    const file = avatarInput.files?.[0];
                    if (!file) return;

                    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
                        await new Modal().renderInfoModal({
                            id: 'invalid-file-type',
                            title: window.ls.__('Invalid File Type'),
                            message: window.ls.__('Only JPG or PNG images are allowed.')
                        });
                        avatarInput.value = '';
                        return;
                    }

                    if (file.size > 2 * 1024 * 1024) {
                        await new Modal().renderInfoModal({
                            id: 'file-too-large',
                            title: window.ls.__('File Too Large'),
                            message: window.ls.__('Avatar must be under 2MB.')
                        });
                        avatarInput.value = '';
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function (e) {
                        if (e.target) {
                            const img = document.createElement('img');
                            img.src = e.target.result as string;
                            img.setAttribute("alt", window.ls.__('Avatar of new User'));
                            img.style.borderRadius = '50%';
                            img.style.objectFit = 'cover';
                            signupAvatar.innerHTML = '';
                            signupAvatar.appendChild(img);
                        }
                    };
                    reader.readAsDataURL(file);
                });
            }

            form.addEventListener('submit', async (e: Event) => {
                e.preventDefault();

                const formData = new FormData(form);

                const password = formData.get('password')?.toString().trim() || '';

                // password check, modal if error
                const confirmPassword = formData.get('passwordConfirm')?.toString().trim() || '';

                if (password !== confirmPassword || (!password && confirmPassword) || (password && !confirmPassword)) {
                    await new Modal().renderInfoModal({
                        id: 'password-mismatch-modal',
                        title: window.ls.__('Validation Error'),
                        message: window.ls.__('Passwords do not match.')
                    });
                    return;
                }

                // Check if 2FA is enabled and validate code
                const twoFactorEnabled = (form.querySelector('input[name="enableTwoFactor"]') as HTMLInputElement)?.checked;
                if (twoFactorEnabled) {
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
                }


                const getStr = (key: string) => String(formData.get(key) || '');
                // const avatarInput = form.querySelector('input[name="avatar"]') as HTMLInputElement;
                const avatarFile = formData.get('avatar') as File;

                const requiredFields = ['name', 'username', 'email', 'password'];
                const missingFields = requiredFields.filter(field => {
                    const val = formData.get(field)?.toString().trim();
                    return !val;
                });

                try {
                    const userData: User = {
                        name: getStr('name'),
                        username: getStr('username'),
                        email: getStr('email'),
                        password: getStr('password'),
                        role: 'user',
                        status: 'offline'
                    };

                    // Only add 2FA fields if 2FA is enabled
                    if (twoFactorEnabled) {
                        userData.secret = getStr('secret');
                        userData.tf_one = getStr('tf_one');
                        userData.tf_two = getStr('tf_two');
                        userData.tf_three = getStr('tf_three');
                        userData.tf_four = getStr('tf_four');
                        userData.tf_five = getStr('tf_five');
                        userData.tf_six = getStr('tf_six');
                    }

                    const avatarFile = formData.get('avatar') as File;
                    let result;

                    if (avatarFile && avatarFile.size > 0) {
                        result = await window.userManagementService.registerUser(userData, avatarFile);
                    }
                    else {
                        result = await window.userManagementService.registerUser(userData);
                    }

                    form.reset();
                    Router.update();

                    if (result) {
                        Router.redirect('/login');
                    }

                }
                catch (error) {
                    console.error('Signup failed:', error);
                    await new Modal().renderInfoModal({
                        id: 'signup-failed',
                        title: window.ls.__('Signup Failed'),
                        message: window.ls.__('Something went wrong while creating your account. Please try again.')
                    });
                }
            });
        }
        catch (error) {
            console.error('Signup form setup error:', error);
            new Modal().renderInfoModal({
                id: 'signup-setup-error',
                title: window.ls.__('Signup Error'),
                message: `${window.ls.__('An unexpected error occurred while setting up the signup form.')}\n\n${(error as Error).message}`
            });
        }
    }
}
