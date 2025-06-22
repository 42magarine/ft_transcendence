import { generateTextVisualization } from "../../utils/Avatar.js";
import Router from '../../utils/Router.js';
import { User, ApiErrorResponse, LoginCredentials, AuthResponse } from "../../interfaces/userManagementInterfaces.js";
import Modal from "../components/Modal.js";

export default class UserManagementService {
	constructor() {}

	async registerUser(userData: User, avatarFile?: File): Promise<string> {
		try {
			let response: Response;

			const isAvatarValid =
				avatarFile &&
				avatarFile.size > 0 &&
				['image/jpeg', 'image/png'].includes(avatarFile.type);

			if (isAvatarValid) {
				console.log('[registerUser] Valid avatar found:', {
					name: avatarFile.name,
					size: avatarFile.size,
					type: avatarFile.type
				});

				const formData = new FormData();
				Object.entries(userData).forEach(([key, value]) => {
					if (value !== undefined && value !== null) {
						formData.append(key, String(value));
					}
				});
				formData.append('avatar', avatarFile);

				response = await fetch('/api/users/register', {
					method: 'POST',
					body: formData
				});
			} else {
				response = await fetch('/api/users/register', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(userData)
				});
			}

			if (!response.ok) {
				const errorData = await response.json() as ApiErrorResponse;
				throw new Error(errorData.error || 'Registration failed');
			}

			Router.update();
			return await response.text();
		} catch (error) {
			await new Modal().renderInfoModal({
				id: 'register-error',
				title: window.ls.__('Registration Failed'),
				message: `${window.ls.__('Could not register the user. Please check your input and try again.')}\n\n${(error as Error).message}`
			});
			throw error;
		}
	}

	async login(credentials: LoginCredentials): Promise<AuthResponse> {
		try {
			const response = await fetch('/api/users/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(credentials)
			});

			if (!response.ok) {
                await response.json() as ApiErrorResponse;
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
			throw error;
		}
	}

	async loginWithGoogle(idToken: string) {
		try {
			const response = await fetch('/api/users/google', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: idToken })
			});

			if (!response.ok) {
				const errorData = await response.json() as ApiErrorResponse;
				throw new Error(errorData.error || 'Google login failed');
			}

			const result = await response.json() as AuthResponse;
			Router.redirect('/');
			return result;
		} catch (error) {
			await new Modal().renderInfoModal({
				id: 'google-login-error',
				title: window.ls.__('Google Login Failed'),
				message: `${window.ls.__('There was a problem logging in with Google.')}\n\n${(error as Error).message}`
			});
			throw error;
		}
	}

	async verifyTwoFactor(userId: number, code: string): Promise<AuthResponse> {
		try {
			const response = await fetch('/api/users/verify-two-factor', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, code })
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
			await new Modal().renderInfoModal({
				id: 'twofactor-error',
				title: window.ls.__('2FA Verification Failed'),
				message: `${window.ls.__('Invalid two-factor code.')}\n\n${(error as Error).message}`
			});
			throw error;
		}
	}

	async requestPasswordReset(email: string): Promise<AuthResponse> {
		try {
			const response = await fetch('/api/request-password-reset', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			return await response.json() as AuthResponse;
		} catch (error) {
			await new Modal().renderInfoModal({
				id: 'password-reset-request-error',
				title: window.ls.__('Reset Failed'),
				message: `${window.ls.__('Unable to request password reset.')}\n\n${(error as Error).message}`
			});
			throw error;
		}
	}

	async resetPassword(token: string, password: string, confirmPassword: string): Promise<AuthResponse> {
		try {
			const response = await fetch(`/api/reset-password/${token}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password, confirmPassword })
			});

			if (!response.ok) {
				const errorData = await response.json() as ApiErrorResponse;
				throw new Error(errorData.error || 'Password reset failed');
			}

			return await response.json() as AuthResponse;
		} catch (error) {
			await new Modal().renderInfoModal({
				id: 'password-reset-error',
				title: window.ls.__('Reset Failed'),
				message: `${window.ls.__('Could not reset your password.')}\n\n${(error as Error).message}`
			});
			throw error;
		}
	}

	async resendVerificationEmail(email: string): Promise<AuthResponse> {
		try {
			const response = await fetch('/api/resend-verification', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			return await response.json() as AuthResponse;
		} catch (error) {
			await new Modal().renderInfoModal({
				id: 'resend-verification-error',
				title: window.ls.__('Verification Failed'),
				message: `${window.ls.__('Could not resend verification email.')}\n\n${(error as Error).message}`
			});
			throw error;
		}
	}

	async logout(): Promise<void> {
		try {
			const response = await fetch('/api/users/logout', {
				method: 'POST'
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			Router.redirect('/');
		} catch (error) {
			await new Modal().renderInfoModal({
				id: 'logout-error',
				title: window.ls.__('Logout Failed'),
				message: `${window.ls.__('An error occurred during logout.')}\n\n${(error as Error).message}`
			});
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
			await new Modal().renderInfoModal({
				id: 'token-verification-error',
				title: window.ls.__('Invalid Token'),
				message: `${window.ls.__('The password reset link is invalid or expired.')}\n\n${(error as Error).message}`
			});
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
			await new Modal().renderInfoModal({
				id: 'email-verification-error',
				title: window.ls.__('Verification Failed'),
				message: `${window.ls.__('Could not verify your email.')}\n\n${(error as Error).message}`
			});
			throw error;
		}
	}

	async updateProfile(userId: string, payload: Record<string, any>): Promise<boolean> {
		try {
			const response = await fetch(`/api/user/${userId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			return response.ok;
		} catch (error) {
			await new Modal().renderInfoModal({
				id: 'profile-update-error',
				title: window.ls.__('Profile Update Failed'),
				message: `${window.ls.__('Could not update the profile.')}\n\n${(error as Error).message}`
			});
			throw error;
		}
	}
}
