interface User {
	username: string;
	email: string;
	displayname?: string;
	password?: string;
}

interface ApiErrorResponse {
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

	static setupEventListeners(): void {
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
						password: formData.get('password') as string, // Get password from form
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
}

// Initialize the event listeners when the DOM is loaded
document.addEventListener('RouterContentLoaded', () => {
	UserManagementService.setupEventListeners();
});