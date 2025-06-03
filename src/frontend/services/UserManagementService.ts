import { generateTextVisualization } from "../../utils/Avatar.js"
import Router from '../../utils/Router.js';
import { User, ApiErrorResponse, LoginCredentials, AuthResponse, PasswordResetRequest, PasswordResetConfirm, QRResponse } from "../../interfaces/userInterfaces.js";
import UserService from "./UserService.js";
import Toggle from "../components/Toggle.js"
import Modal from '../components/Modal.js';

export default class UserManagementService {
    constructor() {
        this.initialize();
    }

    static async registerUser(userData: User, avatarFile?: File): Promise<string> {
        console.log("Registering user with data:", userData);
        try {
            if (userData.secret &&
                userData.tf_one && userData.tf_two && userData.tf_three &&
                userData.tf_four && userData.tf_five && userData.tf_six) {

                const code = `${userData.tf_one}${userData.tf_two}${userData.tf_three}${userData.tf_four}${userData.tf_five}${userData.tf_six}`;
                try {
                    const verifyResponse = await fetch('/api/users/verify-two-factor-setup', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            code: code,
                            secret: userData.secret
                        }),
                    });

                    if (!verifyResponse.ok) {
                        const errorData = await verifyResponse.json() as ApiErrorResponse;
                        throw new Error(errorData.error || 'Two-factor code verification failed');
                    }
                } catch (error) {
                    userData.secret = undefined;
                    userData.tf_one = undefined;
                    userData.tf_two = undefined;
                    userData.tf_three = undefined;
                    userData.tf_four = undefined;
                    userData.tf_five = undefined;
                    userData.tf_six = undefined;
                }
            }

            if (avatarFile && avatarFile.size > 0) {
                const formData = new FormData();

                formData.append('username', userData.username);
                formData.append('email', userData.email);
                formData.append('password', userData.password || '');

                if (userData.displayname) {
                    formData.append('displayname', userData.displayname);
                }

                if (userData.role) {
                    formData.append('role', userData.role);
                }

                if (userData.tf_one) {
                    formData.append('tf_one', userData.tf_one);
                }
                if (userData.tf_two) {
                    formData.append('tf_two', userData.tf_two);
                }
                if (userData.tf_three) {
                    formData.append('tf_three', userData.tf_three);
                }
                if (userData.tf_four) {
                    formData.append('tf_four', userData.tf_four);
                }
                if (userData.tf_five) {
                    formData.append('tf_five', userData.tf_five);
                }
                if (userData.tf_six) {
                    formData.append('tf_six', userData.tf_six);
                }
                if (userData.secret) {
                    formData.append('secret', userData.secret);
                }

                formData.append('avatar', avatarFile);

                const response = await fetch('/api/users/register', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json() as ApiErrorResponse;
                    throw new Error(errorData.error || 'Registration failed');
                }

                Router.update();
                return await response.text();
            } else {
                const response = await fetch('/api/users/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData),
                });

                if (!response.ok) {
                    const errorData = await response.json() as ApiErrorResponse;
                    throw new Error(errorData.error || 'Registration failed');
                }

                Router.update();
                return await response.text();
            }
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Login failed');
            }

            const result = await response.json() as AuthResponse;

            if (result.requireTwoFactor) {
                sessionStorage.setItem('pendingUserId', result.userId?.toString() || '');
                sessionStorage.setItem('pendingUsername', result.username || '');

                Router.redirect('/two-factor');
                return result;
            }

            Router.redirect('/');

            return result;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async loginWithGoogle(idToken: string) {
        const response = await fetch('/api/users/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: idToken }),
        });

        if (!response.ok) {
            const errorData = await response.json() as ApiErrorResponse;
            throw new Error(errorData.error || 'Google login failed');
        }

        const result = await response.json() as AuthResponse;

        Router.redirect('/');

        return result;
    }

    async verifyTwoFactor(userId: number, code: string): Promise<AuthResponse> {
        try {
            const response = await fetch('/api/users/verify-two-factor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, code }),
            });

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Two-factor verification failed');
            }

            const result = await response.json() as AuthResponse;

            sessionStorage.removeItem('pendingUserId');
            sessionStorage.removeItem('pendingUsername');
            Router.update();
            Router.redirect('/');

            return result;
        } catch (error) {
            console.error('Two-factor verification error:', error);
            throw error;
        }
    }

    async requestPasswordReset(email: string): Promise<AuthResponse> {
        try {
            const response = await fetch('/api/request-password-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            return await response.json() as AuthResponse;
        } catch (error) {
            console.error('Password reset request error:', error);
            throw error;
        }
    }

    async resetPassword(token: string, password: string, confirmPassword: string): Promise<AuthResponse> {
        try {
            const response = await fetch(`/api/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password, confirmPassword }),
            });

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Password reset failed');
            }

            return await response.json() as AuthResponse;
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }

    async resendVerificationEmail(email: string): Promise<AuthResponse> {
        try {
            const response = await fetch('/api/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            return await response.json() as AuthResponse;
        } catch (error) {
            console.error('Resend verification error:', error);
            throw error;
        }
    }

    async logout(): Promise<void> {
        try {
            const response = await fetch('/api/users/logout', {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            Router.redirect('/');
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    async verifyPasswordResetToken(token: string): Promise<boolean> {
        try {
            const response = await fetch(`/api/reset-password/${token}`);
            const data = await response.json();

            if (!response.ok || !data.valid) {
                throw new Error(data.error || 'Invalid token');
            }

            return true;
        } catch (error) {
            console.error('Token verification error:', error);
            throw error;
        }
    }

    async verifyEmail(token: string): Promise<boolean> {
        try {
            const response = await fetch(`/api/verify-email/${token}`);

            if (response.ok) {
                return true;
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Email verification failed');
            }
        } catch (error) {
            console.error('Email verification error:', error);
            throw error;
        }
    }

    setupEventListeners(): void {
        this.setupCreateForm();
        this.setupDeleteButtons();
        this.setupLoginForm();
        this.setupSignupForm();
        this.setupPasswordResetRequestForm();
        this.setupPasswordResetForm();
        this.setupResendVerificationForm();
        this.setupLogoutButton();
        this.setupVerifyEmail();
        this.setupTwoFactorForm();
    }

    // private setupCreateForm(): void {
    //     const createForm = document.getElementById('create-form') as HTMLFormElement | null;
    //     if (createForm) {
    //         createForm.addEventListener('submit', async (e) => {
    //             e.preventDefault();

    //             try {
    //                 const formData = new FormData(createForm);

    //                 const userData: User = {
    //                     avatar: formData.get('avatar') as string,
    //                     displayname: formData.get('displayname') as string,
    //                     username: formData.get('username') as string,
    //                     email: formData.get('email') as string,
    //                     password: formData.get('password') as string,
    //                     role: formData.get('role') as string,
    //                     emailVerified: (document.getElementById('emailVerified') as HTMLInputElement)?.value === 'true',
    //                     twoFAEnabled: formData.get('twoFAEnabled') as string,
    //                     status: 'offline'

    //                 };


    //                 const result = await this.registerUser(userData);
    //                 createForm.reset();

    //             } catch (error) {
    //                 console.error('Failed to register user:', error);
    //             }
    //         });
    //         const toggle = new Toggle();
    //         toggle.mountToggle('emailVerified');
    //     }
    // }

    private setupDeleteButtons(): void {
        const deleteButtons = document.querySelectorAll('.delete-user') as NodeListOf<HTMLElement>;
        deleteButtons.forEach((button) => {
            button.addEventListener("click", async function (e) {
                e.preventDefault();

                const clickedElement = e.target as HTMLElement;
                const deleteButton = clickedElement.closest('.delete-user');

                if (!deleteButton) {
                    console.error('Delete button element not found');
                    return;
                }

                const userId = deleteButton.getAttribute('data-user');
                if (!userId) {
                    console.error('No user ID provided for delete operation');
                    return;
                }

                if (confirm('Are you sure you want to delete this user?')) {
                    try {
                        await UserService.deleteUser(parseInt(userId, 10));
                        Router.update();
                    }
                    catch (error) {
                        console.error('Failed to delete user:', error);
                    }
                }
            });
        });
    }

    private setupLoginForm(): void {
        const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                try {
                    const formData = new FormData(loginForm);
                    const credentials: LoginCredentials = {
                        email: formData.get('email') as string,
                        password: formData.get('password') as string,
                    };
                    await this.login(credentials);
                    loginForm.reset();

                } catch (error) {
                    console.error('Failed to login:', error);
                    const errorMessage = document.createElement('div');
                    errorMessage.className = 'mt-4 text-red-500';
                    errorMessage.innerHTML = `
						<p>${error instanceof Error ? error.message : 'Login failed'}</p>
						<p class="mt-2">
							<a href="/password-reset" class="text-blue-500 underline">Forgot password?</a> |
							<a href="#" id="resend-verification" class="text-blue-500 underline">Resend verification email</a>
						</p>
					`;

                    const existingError = document.querySelector('.login-error');
                    if (existingError) {
                        existingError.remove();
                    }

                    errorMessage.classList.add('login-error');
                    loginForm.appendChild(errorMessage);
                    const resendLink = document.getElementById('resend-verification');
                    if (resendLink) {
                        resendLink.addEventListener('click', async (e) => {
                            e.preventDefault();
                            const loginFormData = new FormData(loginForm);
                            const username = loginFormData.get('username') as string;

                            if (!username) {
                                return;
                            }

                            try {
                                const result = await this.resendVerificationEmail(username);
                            } catch (error) {
                                console.error('Failed to resend verification:', error);
                            }
                        });
                    }
                }
            });
        }
    }

    private setupTwoFactorForm(): void {
        const twoFactorForm = document.getElementById('TwoFactorLogin-form') as HTMLFormElement | null;
        if (twoFactorForm) {
            const hiddenUsername = twoFactorForm.querySelector('input[name="username"]') as HTMLInputElement;
            const userId = sessionStorage.getItem('pendingUserId');
            const username = sessionStorage.getItem('pendingUsername');

            if (!userId || !username) {
                Router.redirect('/login');
                return;
            }

            if (hiddenUsername) {
                hiddenUsername.value = username;
            }

            if (!twoFactorForm.querySelector('button[type="submit"]')) {
                const submitButton = document.createElement('button');
                submitButton.type = 'submit';
                submitButton.className = 'btn btn-primary mt-4';
                submitButton.textContent = 'Verify';
                twoFactorForm.appendChild(submitButton);
            }

            twoFactorForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                try {
                    const tf_one = (document.getElementById('tf_one') as HTMLInputElement).value;
                    const tf_two = (document.getElementById('tf_two') as HTMLInputElement).value;
                    const tf_three = (document.getElementById('tf_three') as HTMLInputElement).value;
                    const tf_four = (document.getElementById('tf_four') as HTMLInputElement).value;
                    const tf_five = (document.getElementById('tf_five') as HTMLInputElement).value;
                    const tf_six = (document.getElementById('tf_six') as HTMLInputElement).value;

                    const code = `${tf_one}${tf_two}${tf_three}${tf_four}${tf_five}${tf_six}`;

                    if (code.length !== 6 || !/^\d+$/.test(code)) {
                        return;
                    }

                    await this.verifyTwoFactor(parseInt(userId, 10), code);


                } catch (error) {
                    console.error('Two-factor verification failed:', error);
                }
            });
        }
    }

    private setupSignupForm(): void {
        const signupForm = document.getElementById('signup-form') as HTMLFormElement | null;
        if (signupForm) {
            const avatarInput = signupForm.querySelector('input[name="avatar"]') as HTMLInputElement;
            if (avatarInput) {
                avatarInput.setAttribute('accept', 'image/jpeg, image/png');
            }

            const usernameInput = signupForm.querySelector("input[name=username]");
            const signupavatar = signupForm.querySelector(".signup-avatar");
            const enableTwoFactor = signupForm.querySelector("input[name=enableTwoFactor]");
            const qrDisplay = document.querySelector("#qr-display");
            const twoFactorInterface = document.querySelector("#twoFactorInterface");
            const secHidden = document.querySelector("input[type=hidden][name=secret]") as HTMLInputElement;

            if (enableTwoFactor && qrDisplay && twoFactorInterface) {
                enableTwoFactor.addEventListener("click", async function (e) {
                    const clickedElement = e.target as HTMLInputElement;
                    if (clickedElement.checked) {
                        twoFactorInterface.classList.add('active')
                        try {
                            const response = await fetch('/api/generate-qr');
                            if (!response.ok) {
                                throw new Error(`Error: ${response.status}`);
                            }
                            let qr_response = await response.json() as QRResponse;
                            if (qr_response) {
                                let qrImg = `<img src="${qr_response.qr}"/>`
                                qrDisplay.innerHTML = qrImg;
                                secHidden.value = qr_response.secret
                            }
                        } catch (error) {
                            console.error('Failed to fetch users:', error);
                            return [];
                        }
                    } else {
                        twoFactorInterface?.classList.remove('active')
                        qrDisplay.innerHTML = '';
                        secHidden.value = ''
                    }
                })
            }

            if (usernameInput && signupavatar && avatarInput) {
                usernameInput.addEventListener("keyup", function (e) {
                    if (e.target && (avatarInput.value == "" || avatarInput.value == null)) {
                        const inputElement = e.target as HTMLInputElement;
                        const seed = inputElement.value;

                        const seedSvg = generateTextVisualization(seed, {
                            width: 100,
                            height: 100,
                            useShapes: true,
                            maxShapes: 50,
                            showText: false,
                            backgroundColor: '#f0f0f0'
                        });
                        signupavatar.innerHTML = seedSvg;
                    }
                });
            }

            if (avatarInput && signupavatar) {
                avatarInput.addEventListener("change", function () {
                    if (this.files && this.files[0]) {
                        const file = this.files[0];

                        if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
                            this.value = '';
                            return;
                        }

                        if (file.size > 2 * 1024 * 1024) {
                            this.value = '';
                            return;
                        }

                        const reader = new FileReader();

                        reader.onload = function (e) {
                            if (signupavatar && e.target) {
                                const img = document.createElement('img');
                                img.src = e.target.result as string;

                                signupavatar.innerHTML = '';
                                signupavatar.appendChild(img);
                            }
                        };

                        reader.readAsDataURL(file);
                    } else if (usernameInput) {
                        const inputElement = usernameInput as HTMLInputElement;
                        const seed = inputElement.value;

                        const seedSvg = generateTextVisualization(seed, {
                            width: 100,
                            height: 100,
                            useShapes: true,
                            maxShapes: 50,
                            showText: false,
                            backgroundColor: '#f0f0f0'
                        });
                        signupavatar.innerHTML = seedSvg;
                    }
                });
            }

            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                try {
                    const formData = new FormData(signupForm);

                    const password = formData.get('password') as string;
                    const repeatPassword = formData.get('repeat-password') as string;

                    if (password !== repeatPassword) {
                        return;
                    }

                    const userData: User = {
                        displayname: formData.get('displayname') as string,
                        username: formData.get('username') as string,
                        email: formData.get('email') as string,
                        password: password,
                        role: "user",
                        tf_one: formData.get('tf_one') as string,
                        tf_two: formData.get('tf_two') as string,
                        tf_three: formData.get('tf_three') as string,
                        tf_four: formData.get('tf_four') as string,
                        tf_five: formData.get('tf_five') as string,
                        tf_six: formData.get('tf_six') as string,
                        secret: formData.get('secret') as string,
                        status: 'offline'
                    };

                    const avatarFile = formData.get('avatar') as File;
                    let result;

                   if (avatarFile && avatarFile.size > 0) {
                        result = await UserManagementService.registerUser(userData, avatarFile);
                    } else {
                        result = await UserManagementService.registerUser(userData);
                    }


                    signupForm.reset();
                    Router.redirect('/login');

                } catch (error) {
                    console.error('Failed to register user:', error);
                }
            });
        }
    }

    private setupPasswordResetRequestForm(): void {
        const passwordResetForm = document.getElementById('password-reset-request-form') as HTMLFormElement | null;
        if (passwordResetForm) {
            passwordResetForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                try {
                    const formData = new FormData(passwordResetForm);
                    const email = formData.get('email') as string;

                    if (!email) {
                        return;
                    }

                    const result = await this.requestPasswordReset(email);
                    alert(result.message || 'If your email exists in our system, you will receive a password reset link.');
                    passwordResetForm.reset();
                } catch (error) {
                    console.error('Failed to request password reset:', error);
                }
            });
        }
    }

    private setupPasswordResetForm(): void {
        const resetForm = document.getElementById('password-reset-form') as HTMLFormElement | null;
        if (resetForm) {
            resetForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                try {
                    const formData = new FormData(resetForm);
                    const password = formData.get('password') as string;
                    const confirmPassword = formData.get('confirmPassword') as string;
                    const pathParts = window.location.pathname.split('/');
                    const token = pathParts[pathParts.length - 1];

                    if (!token) {
                        return;
                    }

                    if (!password || !confirmPassword) {
                        return;
                    }

                    if (password !== confirmPassword) {
                        return;
                    }

                    if (password.length < 8) {
                        return;
                    }

                    const result = await this.resetPassword(token, password, confirmPassword);
                    alert(result.message || 'Password reset successful');
                    resetForm.reset();

                    Router.redirect('/login');
                } catch (error) {
                    console.error('Failed to reset password:', error);
                }
            });
        }
    }

    private setupResendVerificationForm(): void {
        const resendForm = document.getElementById('resend-verification-form') as HTMLFormElement | null;
        if (resendForm) {
            resendForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const formData = new FormData(resendForm);
                const email = formData.get('email');

                if (!email) {
                    return;
                }

                try {
                    const response = await this.resendVerificationEmail(email as string);
                    alert(response.message || 'If your account exists, a verification email has been sent.');
                } catch (error) {
                    console.error('Error resending verification email:', error);
                }
            });
        }
    }

    setupLogoutButton(): void {
        const logoutButton = document.getElementById('logout-btn') as HTMLElement | null;
        if (logoutButton) {
            logoutButton.addEventListener('click', async (e) => {
                e.preventDefault();

                try {
                    await this.logout();
                    Router.redirect('/login');
                } catch (error) {
                    console.error('Failed to logout:', error);
                }
            });
        }
    }

    // Handle email verification process - this corresponds to the inline script in EmailVerification.ts
    private setupVerifyEmail(): void {
        if (window.location.pathname.startsWith('/verify-email')) {
            const pathParts = window.location.pathname.split('/');
            const token = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;

            if (token) {
                this.handleEmailVerification(token);
            }
        }
    }

    private async handleEmailVerification(token: string): Promise<void> {
        try {
            const success = await this.verifyEmail(token);

            if (success) {
                Router.redirect('/login?verified=true');
            }
        } catch (error) {
            console.error('Error verifying email:', error);

            const cardContainer = document.querySelector('.space-y-8');
            if (cardContainer) {
                const errorMessage = error instanceof Error ? error.message : 'Email verification failed';

                const errorCard = document.createElement('div');
                errorCard.className = 'bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6';
                errorCard.innerHTML = `
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Verification Failed</h2>
					<div class="mt-4">
						<p class="text-red-500">${errorMessage}</p>
						<p class="mt-4">You can try the following:</p>
						<ul class="list-disc pl-5 mt-2 text-gray-700 dark:text-gray-300">
							<li>Check if you clicked the correct link from your email</li>
							<li>Request a new verification email</li>
							<li>Contact support if the problem persists</li>
						</ul>
						<div class="mt-6">
							<a href="/verify-email" class="text-blue-500 hover:underline">Request New Verification Email</a>
						</div>
					</div>
				`;

                cardContainer.innerHTML = '';
                cardContainer.appendChild(errorCard);
            }
        }
    }

    private twoFactorNumberActions(): void {
        const numericInputs = document.querySelectorAll('.tf_numeric') as NodeListOf<HTMLInputElement>;

        numericInputs.forEach((input, index) => {
            input.addEventListener('input', function (this: HTMLInputElement, e: Event) {
                if (this.value.length > 1) {
                    this.value = this.value.slice(0, 1);
                }
                if (this.value.length === 1 && index < numericInputs.length - 1) {
                    let nextInputIndex = index + 1;
                    while (nextInputIndex < numericInputs.length) {
                        if (!numericInputs[nextInputIndex].value) {
                            numericInputs[nextInputIndex].focus();
                            break;
                        }
                        nextInputIndex++;
                    }
                }
            });

            input.addEventListener('keydown', function (this: HTMLInputElement, e: KeyboardEvent) {
                if ((e.key === 'Backspace' || e.key === 'Delete') && !this.value && index > 0) {
                    numericInputs[index - 1].focus();
                }

                if (e.key === 'ArrowLeft' && index > 0) {
                    numericInputs[index - 1].focus();
                }

                if (e.key === 'ArrowRight' && index < numericInputs.length - 1) {
                    numericInputs[index + 1].focus();
                }
            });

            input.addEventListener('keypress', function (this: HTMLInputElement, e: KeyboardEvent) {
                if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                }
            });

            input.addEventListener('focus', function (this: HTMLInputElement) {
                this.select();
            });
        });
    }

    private initializeGoogleScript() {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.id = 'google-login-script';
        document.head.appendChild(script);
    }

    initialize(): void {
        document.addEventListener('RouterContentLoaded', () => {
            this.setupEventListeners();
            this.twoFactorNumberActions();
            this.setupUserManagementView();
            this.initializeGoogleScript();
        });
    }

    async updateProfile(userId: string, payload: Record<string, any>): Promise<boolean> {
        try {
            const response = await fetch(`/api/user/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            return response.ok;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

        async setupCreateForm()
            {

            }
    public async setupUserManagementView(): Promise<void> {
        const toggle = new Toggle();
        toggle.mountToggle('emailVerified');

        // Inject modal manually into DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = await new Modal().renderModal({
            id: 'confirm-delete-modal',
            title: 'Confirm Deletion',
            content: `
                <p>Are you sure you want to delete this user?<br>
                <strong>This action cannot be undone.</strong></p>
            `,
            footerButtons: [
                {
                    id: 'cancel-delete-btn',
                    text: 'Cancel',
                    className: 'btn btn-secondary',
                    onClick: `document.getElementById('confirm-delete-modal').classList.add('hidden')`
                },
                {
                    id: 'confirm-delete-btn',
                    text: 'Yes, Delete',
                    className: 'btn btn-red'
                }
            ],
            closableOnOutsideClick: true
        });

        document.body.appendChild(modalContainer); // Append modal to end of body

        let selectedUserId: string | null = null;

        const deleteButtons = document.querySelectorAll('button[id^="delete-user-"]');
        deleteButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const match = btn.id.match(/^delete-user-(\d+)$/);
                if (match) {
                    selectedUserId = match[1];
                    const modal = document.getElementById('confirm-delete-modal');
                    if (modal) modal.classList.remove('hidden');
                }
            });
        });

        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        const modal = document.getElementById('confirm-delete-modal');

        if (confirmDeleteBtn && modal) {
            confirmDeleteBtn.addEventListener('click', async () => {
                if (selectedUserId) {
                    try {
                        const success = await UserService.deleteUser(Number(selectedUserId));
                        if (success) window.location.reload();
                        else console.error('Failed to delete user');
                    } catch (err) {
                        console.error('Delete failed:', err);
                    } finally {
                        modal.classList.add('hidden');
                        selectedUserId = null;
                    }
                }
            });
        }

        if (cancelDeleteBtn && modal) {
            cancelDeleteBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
                selectedUserId = null;
            });
        }
    }
}
