import { User, ApiErrorResponse, FriendList } from '../../interfaces/userManagementInterfaces.js';
import Router from '../../utils/Router.js';
import { IServerMessage } from '../../interfaces/interfaces.js';
import Modal from '../components/Modal.js';

export default class UserService {
    private static selectedFriendId: number | null = null;

    public handleSocketMessage(event: MessageEvent<string>): void {
        const data: IServerMessage = JSON.parse(event.data);

        switch (data.type) {
            case 'updateFriendlist':
                if (window.location.href.includes("friends")) {
                    Router.update();
                }
                break;
        }
    }

    static async getCurrentUser(): Promise<User | null> {
        try {
            const response = await fetch('/api/users/me', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                if (response.status === 401) {
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
            await new Modal().renderInfoModal({
                id: 'get-user-failed',
                title: 'Error',
                message: 'Unable to fetch user data. Please try again later.',
            });
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
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'get-all-users-error',
                title: window.ls.__('User Fetch Error'),
                message: `${window.ls.__('Could not retrieve the user list.')}\n\n${(error as Error).message}`
            });
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
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'get-user-error',
                title: window.ls.__('User Fetch Error'),
                message: `${window.ls.__('Could not retrieve the user.')}\n\n${(error as Error).message}`
            });
            return null;
        }
    }

    static async updateUser(userId: string, payload: Record<string, any> | FormData): Promise<boolean> {
        try {
            const isFormData = payload instanceof FormData;

            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                credentials: 'include',
                ...(isFormData
                    ? { body: payload }
                    : {
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
            });

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Failed to update user');
            }

            return response.ok;
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'update-user-error',
                title: window.ls.__('Update Failed'),
                message: `${window.ls.__('Could not update the user.')}\n\n${(error as Error).message}`
            });
            return false;
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
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'delete-user-error',
                title: window.ls.__('Deletion Failed'),
                message: `${window.ls.__('Could not delete the user.')}\n\n${(error as Error).message}`
            });
            return false;
        }
    }

    static async getFriends(): Promise<FriendList[]> {
        try {
            const response = await fetch('/api/users/friendlist');
            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Failed to fetch friends');
            }
            return await response.json() as FriendList[];
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'friendlist-fetch-error',
                title: window.ls.__('Friend List Error'),
                message: `${window.ls.__('Could not fetch the friend list.')}\n\n${(error as Error).message}`
            });
            return [];
        }
    }

    static async addFriendByUsername(username: string): Promise<boolean> {
        try {
            const response = await fetch(`/api/users/friend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error);
            }
            return true;
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'add-friend-error',
                title: window.ls.__('Add Friend Failed'),
                message: `${window.ls.__('Could not add this user as a friend.')}\n\n${(error as Error).message}`
            });
            return false;
        }
    }

    static async removeFriendById(id: number): Promise<boolean> {
        try {
            const response = await fetch(`/api/users/friend/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error);
            }
            return true;
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'remove-friend-error',
                title: window.ls.__('Remove Friend Failed'),
                message: `${window.ls.__('Could not remove the friend.')}\n\n${(error as Error).message}`
            });
            return false;
        }
    }

    public static setSelectedFriendId(id: number | null): void {
        this.selectedFriendId = id;
    }

    public static getSelectedFriendId(): number | null {
        return this.selectedFriendId;
    }
}
