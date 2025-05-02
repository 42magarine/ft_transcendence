import { generateTextVisualization } from "./../../utils/Avartar.js"

interface User {
	id?: number;
	username: string;
	email: string;
	displayname?: string;
	password?: string;
	role?: string;
	avatar?: string;
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

	static setupEventListeners(): void {
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
						username: formData.get('username') as string,
						password: formData.get('password') as string,
					};

					const result = await UserManagementService.login(credentials);
					loginForm.reset();

					window.location.href = '/';

				} catch (error) {
					console.error('Failed to login:', error);
					alert(error instanceof Error ? error.message : 'Login failed');
				}
			});
		}

		// Signup form
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

					// Redirect to login page
					window.location.href = '/login';

				} catch (error) {
					console.error('Failed to register user:', error);
					alert(error instanceof Error ? error.message : 'Registration failed');
				}
			});
		}
	}

	// Logout button
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
}

// Initialize the event listeners when the DOM is loaded
document.addEventListener('RouterContentLoaded', () => {
	UserManagementService.setupEventListeners();
	UserManagementService.setupLogoutButton();
});