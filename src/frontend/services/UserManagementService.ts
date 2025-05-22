import { generateTextVisualization } from "../../utils/Avatar.js"
import Router from '../../utils/Router.js';
import { User, ApiErrorResponse, LoginCredentials, AuthResponse, PasswordResetRequest, PasswordResetConfirm, QRResponse } from "../../interfaces/userInterfaces.js";

export class UserManagementService {
    static async fetchAllUsers(): Promise<User[]> {
        try {
            const response = await fetch('/api/users/');
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            return await response.json() as User[];
        } catch (error) {
            console.error('Failed to fetch users:', error);
            return [];
        }
    }

    static async registerUser(userData: User, avatarFile?: File): Promise<string> {
        console.log("Registering user with data:", userData);
        try {
            // Check if 2FA is enabled but code verification is needed
            if (userData.secret &&
                userData.tf_one && userData.tf_two && userData.tf_three &&
                userData.tf_four && userData.tf_five && userData.tf_six) {

                // Combine the 2FA code
                const code = `${userData.tf_one}${userData.tf_two}${userData.tf_three}${userData.tf_four}${userData.tf_five}${userData.tf_six}`;

                // Verify the 2FA code before registration
                try {
                    // Call to verify the code with the controller
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
                    alert('User registration successful, but two-factor authentication could not be enabled due to invalid code. You can enable it later in your account settings.');

                    // Remove 2FA data before proceeding with registration
                    userData.secret = undefined;
                    userData.tf_one = undefined;
                    userData.tf_two = undefined;
                    userData.tf_three = undefined;
                    userData.tf_four = undefined;
                    userData.tf_five = undefined;
                    userData.tf_six = undefined;
                }
            }

            // Check if we have an avatar file
            if (avatarFile && avatarFile.size > 0) {
                console.log("Uploading avatar file:", avatarFile.name);

                // Create FormData object for multipart/form-data submission
                const formData = new FormData();

                // Add user data fields
                formData.append('username', userData.username);
                formData.append('email', userData.email);
                formData.append('password', userData.password || '');

                if (userData.displayname) {
                    formData.append('displayname', userData.displayname);
                }

                if (userData.role) {
                    formData.append('role', userData.role);
                }

                // Only add 2FA data if it exists
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

                // Add the file with fieldname 'avatar'
                formData.append('avatar', avatarFile);

                console.log("Sending FormData with avatar");

                // Send multipart form request
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
                // Regular JSON request without file
                console.log("Sending JSON data without avatar");

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

    static async login(credentials: LoginCredentials): Promise<AuthResponse> {
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

            // Check if 2FA is required
            if (result.requireTwoFactor) {
                // Store credentials temporarily (for the 2FA verification)
                sessionStorage.setItem('pendingUserId', result.userId?.toString() || '');
                sessionStorage.setItem('pendingUsername', result.username || '');

                // Redirect to 2FA page
                window.location.href = '/two-factor';
                return result;
            }

            // Normal login flow
            Router.update();
            window.location.href = '/';

            return result;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static async loginWithGoogle(idToken: string) {
        console.log("loginWithGoogle");

        const response = await fetch('/api/users/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: idToken }),
        });

        if (!response.ok) {
            const errorData = await response.json() as ApiErrorResponse;
            throw new Error(errorData.error || 'Google login failed');
        }

        const result = await response.json() as AuthResponse;

        // Normal login flow
        Router.update();
        window.location.href = '/';

        return result;
    }

    // New method to verify 2FA code
    static async verifyTwoFactor(userId: number, code: string): Promise<AuthResponse> {
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

            // Clear temporary storage
            sessionStorage.removeItem('pendingUserId');
            sessionStorage.removeItem('pendingUsername');

            // Trigger router update after successful login
            Router.update();

            // Redirect to home page
            window.location.href = '/';

            return result;
        } catch (error) {
            console.error('Two-factor verification error:', error);
            throw error;
        }
    }

    static async requestPasswordReset(email: string): Promise<AuthResponse> {
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

    static async resetPassword(token: string, password: string, confirmPassword: string): Promise<AuthResponse> {
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

    static async resendVerificationEmail(email: string): Promise<AuthResponse> {
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

    static async getCurrentUser(): Promise<User | null> {
        try {
            const response = await fetch('/api/auth/me');
            if (response.status === 401) {
                return null;
            }

            return await response.json() as User;
        } catch (error) {
            console.error('Failed to fetch current user:', error);
            return null;
        }
    }

    static async logout(): Promise<void> {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    static async deleteUser(userId: number): Promise<boolean> {
        try {
            const response = await fetch(`/api/users/delete/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Failed to delete user');
            }

            Router.update();
            return true;
        } catch (error) {
            console.error('Failed to delete user:', error);
            throw error;
        }
    }

    // New method to verify password reset token
    static async verifyPasswordResetToken(token: string): Promise<boolean> {
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

    // New method to verify email
    static async verifyEmail(token: string): Promise<boolean> {
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

    // Setup all event listeners across the application
    static setupEventListeners(): void {
        this.setupCreateForm();
        this.setupDeleteButtons();
        this.setupLoginForm();
        this.setupSignupForm();
        this.setupPasswordResetRequestForm();
        this.setupPasswordResetForm();
        this.setupResendVerificationForm();
        this.setupLogoutButton();
        this.setupVerifyEmail();
        this.setupTwoFactorForm(); // Add the new 2FA form setup
    }

    private static setupCreateForm(): void {
        const createForm = document.getElementById('create-form') as HTMLFormElement | null;
        if (createForm) {
            createForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                try {
                    const formData = new FormData(createForm);
                    const userData: User = {
                        avatar: formData.get('avatar') as string,
                        displayname: formData.get('displayname') as string,
                        username: formData.get('username') as string,
                        email: formData.get('email') as string,
                        password: formData.get('password') as string,
                        role: formData.get('role') as string,
                    };

                    const result = await UserManagementService.registerUser(userData);
                    createForm.reset();

                } catch (error) {
                    console.error('Failed to register user:', error);
                    alert(error instanceof Error ? error.message : 'Registration failed');
                }
            });
        }
    }

    private static setupDeleteButtons(): void {
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
                    alert('Unable to delete user: No ID provided');
                    return;
                }

                if (confirm('Are you sure you want to delete this user?')) {
                    try {
                        await UserManagementService.deleteUser(parseInt(userId, 10));
                    } catch (error) {
                        console.error('Failed to delete user:', error);
                        alert(error instanceof Error ? error.message : 'Failed to delete user');
                    }
                }
            });
        });
    }

    private static setupLoginForm(): void {
        const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                try {
                    const formData = new FormData(loginForm);
                    const credentials: LoginCredentials = {
                        username: formData.get('username') as string,
                        password: formData.get('password') as string,
                    };

                    // The login method now handles redirection to 2FA if needed
                    await UserManagementService.login(credentials);

                    // Form reset only happens if we don't redirect to 2FA
                    loginForm.reset();

                } catch (error) {
                    console.error('Failed to login:', error);
                    alert(error instanceof Error ? error.message : 'Login failed');

                    // Add a link to request password reset or resend verification email
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

                    // Add event listener for resend verification link
                    const resendLink = document.getElementById('resend-verification');
                    if (resendLink) {
                        resendLink.addEventListener('click', async (e) => {
                            e.preventDefault();
                            // Get the username value from the loginForm
                            const loginFormData = new FormData(loginForm);
                            const username = loginFormData.get('username') as string;

                            if (!username) {
                                alert('Please enter your username to resend verification email');
                                return;
                            }

                            try {
                                // For simplicity, we'll use the username as email here
                                const result = await UserManagementService.resendVerificationEmail(username);
                                alert(result.message || 'Verification email sent if account exists');
                            } catch (error) {
                                console.error('Failed to resend verification:', error);
                                alert('Failed to resend verification email');
                            }
                        });
                    }
                }
            });
        }
    }

    // New method to setup 2FA verification form
    private static setupTwoFactorForm(): void {
        const twoFactorForm = document.getElementById('TwoFactorLogin-form') as HTMLFormElement | null;
        if (twoFactorForm) {
            // Populate hidden fields with stored values from the session storage
            const hiddenUsername = twoFactorForm.querySelector('input[name="username"]') as HTMLInputElement;
            const userId = sessionStorage.getItem('pendingUserId');
            const username = sessionStorage.getItem('pendingUsername');

            if (!userId || !username) {
                // No pending 2FA verification, redirect back to login
                window.location.href = '/login';
                return;
            }

            if (hiddenUsername) {
                hiddenUsername.value = username;
            }

            // Add submit button dynamically if it doesn't exist
            if (!twoFactorForm.querySelector('button[type="submit"]')) {
                const submitButton = document.createElement('button');
                submitButton.type = 'submit';
                submitButton.className = 'btn btn-primary mt-4';
                submitButton.textContent = 'Verify';
                twoFactorForm.appendChild(submitButton);
            }

            // Setup form submission
            twoFactorForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                try {
                    // Get all the 2FA code digits
                    const tf_one = (document.getElementById('tf_one') as HTMLInputElement).value;
                    const tf_two = (document.getElementById('tf_two') as HTMLInputElement).value;
                    const tf_three = (document.getElementById('tf_three') as HTMLInputElement).value;
                    const tf_four = (document.getElementById('tf_four') as HTMLInputElement).value;
                    const tf_five = (document.getElementById('tf_five') as HTMLInputElement).value;
                    const tf_six = (document.getElementById('tf_six') as HTMLInputElement).value;

                    // Combine the digits
                    const code = `${tf_one}${tf_two}${tf_three}${tf_four}${tf_five}${tf_six}`;

                    // Validate code format
                    if (code.length !== 6 || !/^\d+$/.test(code)) {
                        alert('Please enter a valid 6-digit code');
                        return;
                    }

                    // Verify the 2FA code
                    await UserManagementService.verifyTwoFactor(parseInt(userId, 10), code);


                } catch (error) {
                    console.error('Two-factor verification failed:', error);
                    alert(error instanceof Error ? error.message : 'Two-factor verification failed');
                }
            });
        }
    }

    private static setupSignupForm(): void {
        const signupForm = document.getElementById('signup-form') as HTMLFormElement | null;
        if (signupForm) {
            // Set accept attribute for avatar file input to only allow image files
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

            // Keep the existing SVG generation based on displayname
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

            // Add file input preview handling
            if (avatarInput && signupavatar) {
                avatarInput.addEventListener("change", function () {
                    if (this.files && this.files[0]) {
                        const file = this.files[0];

                        // Validate file type
                        if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
                            alert('Please select a JPEG or PNG image file');
                            this.value = '';
                            return;
                        }

                        // Validate file size (max 2MB)
                        if (file.size > 2 * 1024 * 1024) {
                            alert('File size should not exceed 2MB');
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
                        // If file is removed, revert to generated avatar based on displayname
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

                    // Check if passwords match
                    const password = formData.get('password') as string;
                    const repeatPassword = formData.get('repeat-password') as string;

                    if (password !== repeatPassword) {
                        alert('Passwords do not match');
                        return;
                    }

                    // Create base user data
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
                        secret: formData.get('secret') as string
                    };

                    // Get the avatar file if it exists
                    const avatarFile = formData.get('avatar') as File;
                    let result;

                    // Check if a file was actually selected
                    if (avatarFile && avatarFile.size > 0) {
                        console.log("Avatar file selected:", avatarFile.name);
                        // Pass both userData and the file
                        result = await UserManagementService.registerUser(userData, avatarFile);
                    } else {
                        console.log("No avatar file selected");
                        // Just pass userData
                        result = await UserManagementService.registerUser(userData);
                    }

                    signupForm.reset();

                    // Show success message
                    alert('Registration successful! Please check your email to verify your account.');

                    // Redirect to login page
                    window.location.href = '/login';

                } catch (error) {
                    console.error('Failed to register user:', error);
                    alert(error instanceof Error ? error.message : 'Registration failed');
                }
            });
        }
    }

    private static setupPasswordResetRequestForm(): void {
        const passwordResetForm = document.getElementById('password-reset-request-form') as HTMLFormElement | null;
        if (passwordResetForm) {
            passwordResetForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                try {
                    const formData = new FormData(passwordResetForm);
                    const email = formData.get('email') as string;

                    if (!email) {
                        alert('Please enter your email address');
                        return;
                    }

                    const result = await UserManagementService.requestPasswordReset(email);
                    alert(result.message || 'If your email exists in our system, you will receive a password reset link.');
                    passwordResetForm.reset();
                } catch (error) {
                    console.error('Failed to request password reset:', error);
                    // For security reasons, we still give a generic message
                    alert('If your email exists in our system, you will receive a password reset link.');
                }
            });
        }
    }

    private static setupPasswordResetForm(): void {
        const resetForm = document.getElementById('password-reset-form') as HTMLFormElement | null;
        if (resetForm) {
            resetForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                try {
                    const formData = new FormData(resetForm);
                    const password = formData.get('password') as string;
                    const confirmPassword = formData.get('confirmPassword') as string;

                    // Get token from URL or parameters
                    // In this case, we'll need to get it from the current path
                    const pathParts = window.location.pathname.split('/');
                    const token = pathParts[pathParts.length - 1];

                    if (!token) {
                        alert('Missing reset token');
                        return;
                    }

                    if (!password || !confirmPassword) {
                        alert('Please fill in all fields');
                        return;
                    }

                    if (password !== confirmPassword) {
                        alert('Passwords do not match');
                        return;
                    }

                    if (password.length < 8) {
                        alert('Password must be at least 8 characters long');
                        return;
                    }

                    const result = await UserManagementService.resetPassword(token, password, confirmPassword);
                    alert(result.message || 'Password reset successful');
                    resetForm.reset();

                    // Redirect to login page
                    window.location.href = '/login';
                } catch (error) {
                    console.error('Failed to reset password:', error);
                    alert(error instanceof Error ? error.message : 'Failed to reset password');
                }
            });
        }
    }

    private static setupResendVerificationForm(): void {
        const resendForm = document.getElementById('resend-verification-form') as HTMLFormElement | null;
        if (resendForm) {
            resendForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const formData = new FormData(resendForm);
                const email = formData.get('email');

                if (!email) {
                    alert('Please enter your email address');
                    return;
                }

                try {
                    const response = await UserManagementService.resendVerificationEmail(email as string);
                    alert(response.message || 'If your account exists, a verification email has been sent.');
                } catch (error) {
                    console.error('Error resending verification email:', error);
                    alert('Failed to resend verification email. Please try again later.');
                }
            });
        }
    }

    static setupLogoutButton(): void {
        const logoutButton = document.getElementById('logout-btn') as HTMLElement | null;
        if (logoutButton) {
            logoutButton.addEventListener('click', async (e) => {
                e.preventDefault();

                try {
                    await UserManagementService.logout();

                    // Redirect to login page
                    window.location.href = '/login';
                } catch (error) {
                    console.error('Failed to logout:', error);
                    alert(error instanceof Error ? error.message : 'Logout failed');
                }
            });
        }
    }

    // Handle email verification process - this corresponds to the inline script in EmailVerification.ts
    private static setupVerifyEmail(): void {
        // Check if we're on the email verification page
        if (window.location.pathname.startsWith('/verify-email')) {
            // Extract token from URL path
            const pathParts = window.location.pathname.split('/');
            const token = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;

            // If we have a token, try to verify the email
            if (token) {
                this.handleEmailVerification(token);
            }
        }
    }

    // Process email verification with token
    private static async handleEmailVerification(token: string): Promise<void> {
        try {
            const success = await this.verifyEmail(token);

            if (success) {
                // Verification successful
                window.location.href = '/login?verified=true';
            }
        } catch (error) {
            console.error('Error verifying email:', error);

            // Display error message
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

    private static twoFactorNumberActions(): void {
        // Get all numeric input fields
        const numericInputs = document.querySelectorAll('.tf_numeric') as NodeListOf<HTMLInputElement>;

        // Add event listeners to each input
        numericInputs.forEach((input, index) => {
            // Handle input event (when value changes)
            input.addEventListener('input', function (this: HTMLInputElement, e: Event) {
                // Restrict to only one digit
                if (this.value.length > 1) {
                    this.value = this.value.slice(0, 1);
                }

                // If we have a digit and we're not at the last input, focus on next available empty input
                if (this.value.length === 1 && index < numericInputs.length - 1) {
                    // Find the next empty input, if any
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

            // Handle keydown for special cases like delete/backspace
            input.addEventListener('keydown', function (this: HTMLInputElement, e: KeyboardEvent) {
                // If backspace/delete on empty field, go back to previous field
                if ((e.key === 'Backspace' || e.key === 'Delete') && !this.value && index > 0) {
                    numericInputs[index - 1].focus();
                }

                // If left arrow and not first field, go to previous field
                if (e.key === 'ArrowLeft' && index > 0) {
                    numericInputs[index - 1].focus();
                }

                // If right arrow and not last field, go to next field
                if (e.key === 'ArrowRight' && index < numericInputs.length - 1) {
                    numericInputs[index + 1].focus();
                }
            });

            // Prevent non-numeric input
            input.addEventListener('keypress', function (this: HTMLInputElement, e: KeyboardEvent) {
                if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                }
            });

            // Select all text when focused
            input.addEventListener('focus', function (this: HTMLInputElement) {
                this.select();
            });
        });
    }
    // Initialize all event listeners when the content is loaded
    static initialize(): void {
        document.addEventListener('RouterContentLoaded', () => {
            this.setupEventListeners();
            this.twoFactorNumberActions();
        });
    }

    static async updateProfile(userId: string, payload: Record<string, any>): Promise<boolean> {
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
}

// Call the initialize method to setup all the listeners
UserManagementService.initialize();


(window as any).handleGoogleLogin = async function (response: any) {
    try {
        await UserManagementService.loginWithGoogle(response.credential);
    }
    catch (error) {
        console.error('Google login failed:', error);
        throw error;
    }
};
