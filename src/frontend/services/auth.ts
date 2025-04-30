export class Auth {
	static instance: Auth | null = null;
	#currentUser: any | null = null;
	#listeners: Array<(user: any | null) => void> = [];

	constructor() {
		if (Auth.instance) {
			return Auth.instance;
		}
		Auth.instance = this;

		// Try to load user on initialization
		this.refreshCurrentUser();
	}

	/**
	 * Fetch the current user from the API
	 * @returns {Promise<void>}
	 */
	async refreshCurrentUser(): Promise<void> {
		try {
			const response = await fetch('/api/auth/me', {
				credentials: 'include', // Important to include cookies
			});

			if (response.ok) {
				this.#currentUser = await response.json();
				this.notifyListeners();
			} else {
				this.#currentUser = null;
			}
		} catch (error) {
			console.error('Failed to fetch current user:', error);
			this.#currentUser = null;
		}
	}

	/**
	 * Get the current user
	 * @returns {Object|null} The current user or null if not logged in
	 */
	getCurrentUser(): any | null {
		return this.#currentUser;
	}

	/**
	 * Check if a user is logged in
	 * @returns {boolean}
	 */
	isLoggedIn(): boolean {
		return this.#currentUser !== null;
	}

	/**
	 * Register a listener to be notified when the user changes
	 * @param {Function} listener
	 */
	addListener(listener: (user: any | null) => void): void {
		this.#listeners.push(listener);
	}

	/**
	 * Remove a listener
	 * @param {Function} listener
	 */
	removeListener(listener: (user: any | null) => void): void {
		this.#listeners = this.#listeners.filter(l => l !== listener);
	}

	/**
	 * Notify all listeners of a user change
	 */
	notifyListeners(): void {
		for (const listener of this.#listeners) {
			listener(this.#currentUser);
		}
	}

	/**
	 * Helper method to get a single instance
	 * @returns {Auth}
	 */
	static getInstance(): Auth {
		if (!Auth.instance) {
			new Auth();
		}
		return Auth.instance as Auth;
	}

	/**
	 * Logout the current user
	 * @returns {Promise<void>}
	 */
	async logout(): Promise<void> {
		try {
			const response = await fetch('/api/auth/logout', {
				method: 'POST',
				credentials: 'include',
			});

			if (response.ok) {
				this.#currentUser = null;
				this.notifyListeners();
			}
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}
}

export default Auth;