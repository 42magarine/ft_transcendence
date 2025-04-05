// view/main.ts
import Router from './router.js';

// Define global utility functions
window.getLoggedIn = function (): boolean {
	// Check localStorage for auth token
	return !!localStorage.getItem('auth_token');
};

window.getPlayerData = async function () {
	// Fetch player data from API
	try {
		const token = localStorage.getItem('auth_token');
		if (!token) return null;

		const response = await fetch('/api/player/data', {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw new Error('Failed to fetch player data');
		}

		return await response.json();
	} catch (error) {
		console.error('Error fetching player data:', error);
		return null;
	}
};

window.checkLoginStatus = async function () {
	// Verify token validity with the server
	try {
		const token = localStorage.getItem('auth_token');
		if (!token) return false;

		const response = await fetch('/api/auth/validate', {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		const isValid = response.ok;

		if (!isValid) {
			// Clear invalid token
			localStorage.removeItem('auth_token');
		}

		return isValid;
	} catch (error) {
		console.error('Error checking login status:', error);
		return false;
	}
};

window.updateLoginState = function () {
	// Update UI elements based on login state
	const isLoggedIn = window.getLoggedIn();

	// Update navigation links if they exist
	const loginLink = document.querySelector('.nav-login');
	const logoutLink = document.querySelector('.nav-logout');
	const profileLink = document.querySelector('.nav-profile');

	if (loginLink) {
		loginLink.classList.toggle('hidden', isLoggedIn);
	}

	if (logoutLink) {
		logoutLink.classList.toggle('hidden', !isLoggedIn);
	}

	if (profileLink) {
		profileLink.classList.toggle('hidden', !isLoggedIn);
	}
};

// Initialize router when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	console.log("DOMContentLoaded");
	console.log("sdf");
	console.log("234");
	console.log("ertert");
	console.log("35353535");
	const router = new Router();

	// Render the initial view
	router.render();
});

// TypeScript declarations for global functions
declare global {
	interface Window {
		getLoggedIn: () => boolean;
		getPlayerData: () => Promise<any>;
		checkLoginStatus: () => Promise<boolean>;
		updateLoginState: () => void;
	}
}