import { User, ApiErrorResponse } from '../../interfaces/userInterfaces.js';

export default class UserService {
    static async getCurrentUser(): Promise<User | null> {

        try {
            const response = await fetch('/api/users/me', {
                method: 'GET',
                credentials: 'include', // This is CRUCIAL for sending cookies
                headers: {
                    'Content-Type': 'application/json',
                    // If you're using Authorization header instead of cookies:
                    // 'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.status === 401) {
                return null;
            }

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Failed to fetch current user');
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
    // static async getCurrentUser(): Promise<User | null> {
    //     try {
    //         const response = await fetch('/api/users/me');
    //         if (response.status === 401) {
    //             return null;
    //         }

    //         if (!response.ok) {
    //             const errorData = await response.json() as ApiErrorResponse;
    //             throw new Error(errorData.error || 'Failed to fetch current user');
    //         }

    //         const data = await response.json();
    //         return data === null ? null : data as User;
    //     }
    //     catch (error) {
    //         return null;
    //     }
    // }
    static async getAllUsers(): Promise<User[]> {
        try {
            const response = await fetch('/api/users');

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
                return null;
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
