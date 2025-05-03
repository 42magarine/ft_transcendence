import { generateTextVisualization } from "./../../utils/Avartar.js"
import Router from '../../utils/Router.js';

interface User {
	id?: number;
	username: string;
	email: string;
	displayname?: string;
	password?: string;
	role?: string;
	avatar?: string;
	emailVerified?: boolean;
}

interface ApiErrorResponse {
	error?: string;
}

interface LoginCredentials {
	username: string;
	password: string;
}

interface AuthResponse {
	message?: string;
	error?: string;
}

interface PasswordResetRequest {
	email: string;
}

interface PasswordResetConfirm {
	password: string;
	confirmPassword: string;
	token: string;
}

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

			// Trigger router update after successful login
			Router.update();

			return result;
		} catch (error) {
			console.error('Login error:', error);
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

					const result = await UserManagementService.login(credentials);
					loginForm.reset();

					// Check if the user was redirected with a verified=true parameter
					const urlParams = new URLSearchParams(window.location.search);
					if (urlParams.get('verified') === 'true') {
						alert('Your email has been verified. You can now log in.');
					}

					window.location.href = '/';

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
								// In a real app, you might want to show another form or have a dedicated page
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

	private static setupSignupForm(): void {
		const signupForm = document.getElementById('signup-form') as HTMLFormElement | null;
		if (signupForm) {
			// Set accept attribute for avatar file input to only allow image files
			const avatarInput = signupForm.querySelector('input[name="avatar"]') as HTMLInputElement;
			if (avatarInput) {
				avatarInput.setAttribute('accept', 'image/jpeg, image/png');
			}

			const displaynameInput = signupForm.querySelector("input[name=displayname]");
			const signupavatar = signupForm.querySelector(".signup-avatar");

			// Keep the existing SVG generation based on displayname
			if (displaynameInput && signupavatar) {
				displaynameInput.addEventListener("keyup", function (e) {
					if (e.target) {
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
								img.style.width = '100px';
								img.style.height = '100px';
								img.style.objectFit = 'cover';
								img.style.borderRadius = '50%';

								signupavatar.innerHTML = '';
								signupavatar.appendChild(img);
							}
						};

						reader.readAsDataURL(file);
					} else if (displaynameInput) {
						// If file is removed, revert to generated avatar based on displayname
						const inputElement = displaynameInput as HTMLInputElement;
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

	// Initialize all event listeners when the content is loaded
	static initialize(): void {
		document.addEventListener('RouterContentLoaded', () => {
			this.setupEventListeners();
		});
	}
}

// Call the initialize method to setup all the listeners
UserManagementService.initialize();