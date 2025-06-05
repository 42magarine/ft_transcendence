import { User, ApiErrorResponse } from '../../interfaces/userManagementInterfaces.js';

export default class UserService {
    static async getCurrentUser(): Promise<User | null> {
        try {
            const response = await fetch('/api/users/me', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Nur bei echten Auth-Fehlern (expired token)
                    // Hier refresh token logic?
                    return null;
                }
                throw new Error('Failed to fetch current user');
            }

            const responseText = await response.text();
            if (responseText.trim() === 'null') {
                return null;
            }

            const userData = JSON.parse(responseText) as User;
            return userData;
        }
        catch (error) {
            return null;
        }
    }

    static async getAllUsers(): Promise<User[]> {
        try {
            const response = await fetch('/api/users/');

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Failed to fetch all users');
            }

            return await response.json() as User[];
        }
        catch (error) {
            console.error('Failed to fetch all users:', error);
            return [];
        }
    }

    static async getUserById(userId: number): Promise<User | null> {
        try {
            const response = await fetch(`/api/users/${userId}`);
            if (response.status === 404) {
                throw new Error(`User with ID ${userId} not found`);
            }


            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || `Failed to fetch user with id ${userId}`);
            }
            return await response.json() as User;
        }
        catch (error) {
            console.error(`Failed to fetch user with id ${userId}:`, error);
            throw error;
        }
    }

    static async updateUser(userId: string, payload: Record<string, any>): Promise<boolean> {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Failed to update user');
            }
            return response.ok;
        }
        catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    static async deleteUser(userId: number): Promise<boolean> {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Failed to delete user');
            }
            return true;
        }
        catch (error) {
            console.error('Failed to delete user:', error);
            throw error;
        }
    }
}
