interface User {
	id?: number;
	username: string;
	email: string;
	displayname?: string;
	password?: string;
	role?: string;
}

interface ApiErrorResponse {
	error?: string;
}

interface LoginCredentials {
	email: string;
	password: string;
}

interface AuthResponse {
	message?: string;
	error?: string;
}

import Router from '../../utils/Router.js';

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

	static async registerUser(userData: User): Promise<string> {
		try {
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

	static async getCurrentUser(): Promise<User | null> {
		try {
			const response = await fetch('/api/auth/me');
			if (response.status === 401) {
				// Not authenticated
				return null;
			}

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
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

			// Trigger router update after logout
			Router.update();
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

	static setupEventListeners(): void {
		// Registration form
		const createForm = document.getElementById('create-form') as HTMLFormElement | null;
		if (createForm) {
			createForm.addEventListener('submit', async (e) => {
				e.preventDefault();

				try {
					const formData = new FormData(createForm);
					const userData: User = {
						displayname: formData.get('displayname') as string,
						username: formData.get('username') as string,
						email: formData.get('email') as string,
						password: formData.get('password') as string,
					};

					const result = await UserManagementService.registerUser(userData);
					createForm.reset();

					// Show success message
					alert('Registration successful!');

				} catch (error) {
					console.error('Failed to register user:', error);
					alert(error instanceof Error ? error.message : 'Registration failed');
				}
			});
		}

		// Delete user buttons
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
						alert('User deleted successfully');
					} catch (error) {
						console.error('Failed to delete user:', error);
						alert(error instanceof Error ? error.message : 'Failed to delete user');
					}
				}
			});
		});

		// Login form
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

					const result = await UserManagementService.login(credentials);
					loginForm.reset();

					// Show success message and redirect
					alert('Login successful!');

					// Redirect to homepage or dashboard
					window.location.href = '/dashboard';

				} catch (error) {
					console.error('Failed to login:', error);
					alert(error instanceof Error ? error.message : 'Login failed');
				}
			});
		}

		// Signup form
		const signupForm = document.getElementById('signup-form') as HTMLFormElement | null;
		if (signupForm) {
			signupForm.addEventListener('submit', async (e) => {
				e.preventDefault();

				try {
					const formData = new FormData(signupForm);
					const userData: User = {
						displayname: formData.get('displayname') as string,
						username: formData.get('username') as string,
						email: formData.get('email') as string,
						password: formData.get('password') as string,
					};

					const result = await UserManagementService.registerUser(userData);
					signupForm.reset();

					// Show success message
					alert('Registration successful! Please login.');

					// Redirect to login page
					window.location.href = '/login';

				} catch (error) {
					console.error('Failed to register user:', error);
					alert(error instanceof Error ? error.message : 'Registration failed');
				}
			});
		}

		// Logout button
		const logoutButton = document.getElementById('logout-button') as HTMLElement | null;
		if (logoutButton) {
			logoutButton.addEventListener('click', async (e) => {
				e.preventDefault();

				try {
					await UserManagementService.logout();
					alert('Logout successful!');

					// Redirect to login page
					window.location.href = '/login';
				} catch (error) {
					console.error('Failed to logout:', error);
					alert(error instanceof Error ? error.message : 'Logout failed');
				}
			});
		}
	}
}

// Initialize the event listeners when the DOM is loaded
document.addEventListener('RouterContentLoaded', () => {
	UserManagementService.setupEventListeners();
});