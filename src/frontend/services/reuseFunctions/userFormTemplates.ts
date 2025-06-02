// File: frontend/services/reuseFunctions/userFormTemplates.ts

import { User } from '../../interfaces/userInterfaces.js';

// Extracts common fields from a form and returns a base User object
export function extractUserDataFromForm(form: HTMLFormElement): User {
	const formData = new FormData(form);
	return {
		displayname: formData.get('displayname') as string,
		username: formData.get('username') as string,
		email: formData.get('email') as string,
		password: formData.get('password') as string,
		role: (formData.get('role') as string) || 'user',
		status: 'offline',
		emailVerified: (document.getElementById('emailVerified') as HTMLInputElement)?.value === 'true',
		twoFAEnabled: (document.getElementById('twoFAEnabled') as HTMLInputElement)?.value === 'true',
		tf_one: formData.get('tf_one') as string,
		tf_two: formData.get('tf_two') as string,
		tf_three: formData.get('tf_three') as string,
		tf_four: formData.get('tf_four') as string,
		tf_five: formData.get('tf_five') as string,
		tf_six: formData.get('tf_six') as string,
		secret: formData.get('secret') as string,
	};
}

// Validates that the password and confirmation match
export function validatePasswordMatch(form: HTMLFormElement): boolean {
	const password = (form.querySelector('[name="password"]') as HTMLInputElement)?.value;
	const confirm = (form.querySelector('[name="passwordConfirm"]') as HTMLInputElement)?.value;

	if (password && confirm && password !== confirm) {
		alert('Passwords do not match.');
		return false;
	}
	return true;
}

// Gets the avatar file from the form, if any
export function getAvatarFile(form: HTMLFormElement): File | null {
	const file = (form.querySelector('input[name="avatar"]') as HTMLInputElement)?.files?.[0];
	return file && file.size > 0 ? file : null;
}
