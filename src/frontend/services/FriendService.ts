
import { User, ApiErrorResponse, FriendList } from '../../interfaces/userManagementInterfaces.js';
import Modal from '../components/Modal.js'
import UserService from './UserService.js'

export default class FriendService {static async getFriends(): Promise<FriendList[]> {
        try {
            const users = await UserService.getAllUsers();
            return users
                .filter(user => typeof user.id === 'number')
                .map((user) => ({
                    id: user.id!,
                    username: user.username,
                    status: Math.random() > 0.5 ? 'online' : 'offline'
                }));
        }
        catch (error) {
            console.error('[UserService] Failed to fetch friends:', error);
            return [];
        }
    }

    static async addFriendByUsername(username: string): Promise<boolean> {
        console.log('[UserService] Attempting to add friend:', username);
        try {
            const response = await fetch(`/api/friends/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Add failed');
            console.log('[UserService] Friend added:', result);
            return true;
        }
        catch (error) {
            console.error('[UserService] Failed to add friend:', error);
            return false;
        }
    }

    static async removeFriendById(id: number): Promise<boolean> {
        console.log('[UserService] Attempting to remove friend ID:', id);
        try {
            const response = await fetch(`/api/friends/remove/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error(await response.text());
            console.log('[UserService] Friend removed:', id);
            return true;
        }
        catch (error) {
            console.error('[UserService] Failed to remove friend:', error);
            return false;
        }
    }

    static attachFriendHandlers(): void {
        const addBtn = document.getElementById('add-friend-btn');
        const input = document.querySelector<HTMLInputElement>('input[name="username"]');
        const feedback = document.getElementById('friend-feedback'); // our feedback label

        let selectedFriendId: number | null = null;

        // Handle Add Friend
        if (addBtn && input) {
            addBtn.addEventListener('click', async () => {
                const username = input.value.trim();

                // Show warning if input is empty
                if (!username) {
                    if (feedback) {
                        feedback.textContent = 'Please enter a username.';
                        feedback.classList.remove('hidden');
                        feedback.classList.remove('text-green-500');
                        feedback.classList.add('text-red-500');
                    }
                    return;
                }

                const success = await this.addFriendByUsername(username);
                if (success) {
                    if (feedback) {
                        feedback.textContent = 'Friend added successfully.';
                        feedback.classList.remove('hidden');
                        feedback.classList.remove('text-red-500');
                        feedback.classList.add('text-green-500');
                    }
                    setTimeout(() => location.reload(), 1000);
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

            // Clear message on input
            input.addEventListener('input', () => {
                if (feedback) {
                    feedback.classList.add('hidden');
                    feedback.textContent = '';
                }
            });
        }

        // Handle Remove Friend buttons
        document.querySelectorAll('[id^="remove-friend-"]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = Number(btn.id.split('remove-friend-')[1]);
                if (isNaN(id)) return;

                selectedFriendId = id;
                const modal = document.getElementById('confirm-remove-modal');
                if (modal) modal.classList.remove('hidden');
            });
        });

        // Confirm Remove
        const confirmBtn = document.getElementById('confirm-remove-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                if (selectedFriendId === null) {
                    return;
                }

                const success = await this.removeFriendById(selectedFriendId);
                if (success) {
                    location.reload();
                }
                else {
                    const modal = document.getElementById('confirm-remove-modal');
                    if (modal) modal.classList.add('hidden');
                }
            });
        }

        // Cancel Remove
        const cancelBtn = document.getElementById('cancel-remove-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                const modal = document.getElementById('confirm-remove-modal');
                if (modal) modal.classList.add('hidden');
                selectedFriendId = null;
            });
        }
    }
}