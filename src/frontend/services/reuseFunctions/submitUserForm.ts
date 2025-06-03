// File: frontend/services/submitUserForm.ts

import Router from '../../../utils/Router.js';
import { User } from '../../../interfaces/userInterfaces.js';
import UserService from '../UserService.js';

// Define the options expected by the submission handler
interface SubmitUserFormOptions {
	formId: string;              // ID of the form to attach to
	isUpdate?: boolean;          // Whether we're updating an existing user
	userId?: string;             // ID of the user to update (if applicable)
	onSuccessRedirect?: string;  // Where to redirect on success
}

// Main function to handle registration or profile update
export async function handleUserFormSubmit({
	formId,
	isUpdate = false,
	userId,
	onSuccessRedirect = '/users'
}: SubmitUserFormOptions): Promise<void> {

	// Get form element by ID
	const form = document.getElementById(formId) as HTMLFormElement | null;
	if (!form) {
		console.warn(`[handleUserFormSubmit] Form #${formId} not found.`);
		return;
	}

	// Attach submit handler
	form.addEventListener('submit', async (e) => {
		e.preventDefault(); // Prevent default form submission behavior

		try {
			// Create FormData object from form inputs
			const formData = new FormData(form);

			// Assemble user data object from form fields
			const userData: User = {
                displayname: formData.get('displayname') as string,
                username: formData.get('username') as string,
                email: formData.get('email') as string,
                password: formData.get('password') as string,
                role: formData.get('role') as string || 'user',
                status: 'offline',
                emailVerified: (document.getElementById('emailVerified') as HTMLInputElement)?.value === 'true',
                twoFAEnabled: (document.getElementById('twoFAEnabled') as HTMLInputElement)?.value === 'true',
            };

			// If password and confirmation are provided, ensure they match
			const confirmPassword = formData.get('passwordConfirm') as string;
			if (userData.password && confirmPassword && userData.password !== confirmPassword) {
				alert('Passwords do not match.');
				return;
			}

			// Check for avatar upload
			const avatarFile = formData.get('avatar') as File;
			const hasAvatar = avatarFile && avatarFile.size > 0;

			let result: boolean;

			// If updating user
			if (isUpdate && userId) {
				result = await UserService.updateUser(userId, userData);
			}
			// If creating new user
			else {
				if (hasAvatar) {
					// Use FormData to include avatar
					const uploadData = new FormData();
					Object.entries(userData).forEach(([key, val]) => {
                        if (val !== undefined && val !== null) {
                            uploadData.append(key, String(val));  // ✅ converts boolean to string
                        }
                    });
					uploadData.append('avatar', avatarFile);

					// Register with avatar
					//await UserService.registerUser(userData, avatarFile);
				} else {
					// Register without avatar
					//await UserService.registerUser(userData);
				}
				result = true;
			}

			// On success: reset form and redirect
			if (result) {
				form.reset();
				Router.redirect(onSuccessRedirect);
			}
		} catch (error) {
			// Catch any failure during the process
			console.error('[handleUserFormSubmit] Submission failed:', error);
		}
	});
}
