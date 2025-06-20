import { User, ApiErrorResponse, FriendList } from '../../interfaces/userManagementInterfaces.js';
import Router from '../../utils/Router.js';
import { IServerMessage } from '../../interfaces/interfaces.js';

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

    static async getFriends(): Promise<FriendList[]> {
        try {
            const response = await fetch('/api/users/friendlist');
            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Failed to fetch friends');
            }
            return await response.json() as FriendList[];
        }
        catch (error) {
            console.error('Failed to fetch friends:', error);
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
        }
        catch (error) {
            console.error('Failed to add friend:', error);
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
        }
        catch (error) {
            console.error('Failed to remove friend:', error);
            return false;
        }
    }
    static attachFriendHandlers(): void {
        const addBtn = document.getElementById('add-friend-btn');
        const input = document.querySelector<HTMLInputElement>('input[name="username"]');
        const feedback = document.getElementById('friend-feedback');

        // Handle Add Friend
        if (addBtn && input) {
            addBtn.addEventListener('click', async () => {
                const username = input.value.trim();
                if (!username) {
                    if (feedback) {
                        feedback.textContent = 'Please enter a username.';
                        feedback.classList.remove('hidden');
                        feedback.classList.remove('text-green-500');
                        feedback.classList.add('text-red-500');
                    }
                    return;
                }

                const success = await UserService.addFriendByUsername(username);
                if (success) {
                    if (feedback) {
                        feedback.textContent = 'Friend added successfully.';
                        feedback.classList.remove('hidden');
                        feedback.classList.remove('text-red-500');
                        feedback.classList.add('text-green-500');
                    }
                    setTimeout(() => Router.update(), 1000);
                }
                else {
                    if (feedback) {
                        feedback.textContent = 'Failed to add friend.';
                        feedback.classList.remove('hidden');
                        feedback.classList.remove('text-green-500');
                        feedback.classList.add('text-red-500');
                    }
                }
            });

            input.addEventListener('input', () => {
                if (feedback) {
                    feedback.classList.add('hidden');
                    feedback.textContent = '';
                }
            });

            input.addEventListener('keydown', async (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addBtn.click();
                }
            });
        }

        // Handle Remove Friend buttons
        document.querySelectorAll('[id^="remove-friend-"]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = Number(btn.id.split('remove-friend-')[1]);
                if (isNaN(id)) {
                    return;
                }

                UserService.selectedFriendId = id;
                const modal = document.getElementById('confirm-remove-modal');
                if (modal) {
                    modal.classList.remove('hidden');
                }
            });
        });

        // Modal Outside Click Handler
        const modal = document.getElementById('confirm-remove-modal');
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                    UserService.selectedFriendId = null;
                }
            };
        }

        // Confirm Remove
        const confirmBtn = document.getElementById('confirm-remove-btn');
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                if (UserService.selectedFriendId === null) return;

                const success = await UserService.removeFriendById(UserService.selectedFriendId);
                if (success) {
                    Router.update();
                }
                else {
                    const modal = document.getElementById('confirm-remove-modal');
                    if (modal) modal.classList.add('hidden');
                }
                UserService.selectedFriendId = null;
            };
        }

        // Cancel Remove
        const cancelBtn = document.getElementById('cancel-remove-btn');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                const modal = document.getElementById('confirm-remove-modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
                UserService.selectedFriendId = null;
            };
        }
    }
}
