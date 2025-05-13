import type { User } from '../../types/interfaces.js';

export default class UserService {
	private users: Map<number, User> = new Map();

	async getCurrentUser(): Promise<User | null> {
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

	async getUserById(userId: number): Promise<User> {
		if (this.users.has(userId)) {
			return this.users.get(userId)!;
		}

		try {
			const response = await fetch(`/api/users/${userId}`);
			if (!response.ok) {
				throw new Error(`Error fetching user with id ${userId}`);
			}
			const userInfo = await response.json() as User;
			this.users.set(userId, userInfo);
			return userInfo;
		} catch (error) {
			console.error(`Failed to fetch user with id ${userId}:`, error);
			throw error;
		}
	}

	async getAllUsers(): Promise<User[]> {
		try {
			const response = await fetch('/api/users');
			if (!response.ok) {
				throw new Error('Error fetching users list');
			}
			return await response.json() as User[];
		} catch (error) {
			console.error('Failed to fetch all users:', error);
			return [];
		}
	}
}
