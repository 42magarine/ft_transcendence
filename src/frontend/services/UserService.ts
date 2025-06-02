import { User, ApiErrorResponse, FriendList } from '../../interfaces/userInterfaces.js';

export default class UserService {
    static async getCurrentUser(): Promise<User | null> {
        try {
            const response = await fetch('/api/users/me', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
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

    static attachProfileFormHandlers(formId: string, userId: string): void
    {
        console.log(`[attachProfileFormHandlers] Initializing with formId: ${formId} and userId: ${userId}`);
        const form = document.getElementById(formId) as HTMLFormElement | null;
        if (!form)
        {
            console.warn(`[attachProfileFormHandlers] Form with ID '${formId}' not found`);
            return;
        }
        console.log('[attachProfileFormHandlers] Form found.');
    
        const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement;
        const confirmPasswordRow = document.getElementById('password-confirm-row');
    
        if (passwordInput && confirmPasswordRow)
        {
            console.log('[attachProfileFormHandlers] Password input and confirm row found.');
            passwordInput.addEventListener('input', () =>
            {
                console.log('[attachProfileFormHandlers] Password input detected:', passwordInput.value);
                if (passwordInput.value.trim().length > 0)
                {
                    console.log('[attachProfileFormHandlers] Showing confirm password row.');
                    confirmPasswordRow.style.display = 'block';
                }
                else
                {
                    console.log('[attachProfileFormHandlers] Hiding confirm password row and clearing confirm input.');
                    confirmPasswordRow.style.display = 'none';
                    const confirmInput = confirmPasswordRow.querySelector('input[name="passwordConfirm"]') as HTMLInputElement;
                    if (confirmInput) confirmInput.value = '';
                }
            });
        }
    
        form.addEventListener('submit', async (e) =>
        {
            e.preventDefault();
            console.log('[attachProfileFormHandlers] Submit triggered');
    
            const formData = new FormData(form);
            const payload: any = Object.fromEntries(formData.entries());
            console.log('[attachProfileFormHandlers] Form payload before processing:', payload);
    
            const password = payload.password as string;
            const confirmPassword = payload.passwordConfirm as string;
            payload.emailVerified = (formData.get('emailVerified') === 'true');
    
            if (password)
            {
                if (password !== confirmPassword)
                {
                    console.warn('[attachProfileFormHandlers] Passwords do not match.');
                    alert('Passwords do not match.');
                    return;
                }
            }
            else
            {
                delete payload.password;
                delete payload.passwordConfirm;
            }
    
            try
            {
                console.log('[attachProfileFormHandlers] Sending updateUser request...');
                const success = await UserService.updateUser(userId, payload);
                if (success)
                {
                    console.log('[attachProfileFormHandlers] Update successful, redirecting...');
                    window.location.href = `/users/${userId}`;
                }
                else
                {
                    console.error('[attachProfileFormHandlers] Failed to update profile.');
                }
            }
            catch (error)
            {
                console.error('[attachProfileFormHandlers] Update failed:', error);
            }
        });
    }
    

    static attachDeleteHandler(buttonId: string, modalId: string, confirmButtonId: string, userId: string): void
    {
        const deleteBtn = document.getElementById(buttonId);
        const confirmBtn = document.getElementById(confirmButtonId);
        const modal = document.getElementById(modalId);

        if (deleteBtn && modal)
        {
            deleteBtn.addEventListener('click', () =>
            {
                modal.classList.remove('hidden');
            });
        }

        if (confirmBtn && modal)
        {
            confirmBtn.addEventListener('click', async () =>
            {
                try
                {
                    const success = await UserService.deleteUser(Number(userId));
                    if (success)
                    {
                        window.location.href = '/user-mangement';
                    }
                    else
                    {
                        console.error('Failed to delete user.');
                        modal.classList.add('hidden');
                    }
                }
                catch (error)
                {
                    console.error('Delete failed:', error);
                    modal.classList.add('hidden');
                }
            });
        }
    }

    static async getFriends(): Promise<FriendList[]> {
        try {
            const users = await UserService.getAllUsers();
            return users
                .filter(user => typeof user.id === 'number')
                .map((user) => ({
                    id: user.id!,
                    username: user.username,
                    status: Math.random() > 0.5 ? 'online' : 'offline'
                }));
        } catch (error) {
            console.error('[UserService] Failed to fetch friends:', error);
            return [];
        }
    }
    
    static async addFriendByUsername(username: string): Promise<boolean> {
        console.log('[UserService] Attempting to add friend:', username);
        try {
            const response = await fetch(`/api/users/friends`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Add failed');
            console.log('[UserService] Friend added:', result);
            return true;
        } catch (error) {
            console.error('[UserService] Failed to add friend:', error);
            return false;
        }
    }
    
    static async removeFriendById(id: number): Promise<boolean> {
        console.log('[UserService] Attempting to remove friend ID:', id);
        try {
            const response = await fetch(`/api/users/friends/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error(await response.text());
            console.log('[UserService] Friend removed:', id);
            return true;
        } catch (error) {
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
    
                const success = await UserService.addFriendByUsername(username);
                if (success) {
                    if (feedback) {
                        feedback.textContent = 'Friend added successfully.';
                        feedback.classList.remove('hidden');
                        feedback.classList.remove('text-red-500');
                        feedback.classList.add('text-green-500');
                    }
                    setTimeout(() => location.reload(), 1000);
                } else {
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
                if (selectedFriendId === null) return;
    
                const success = await UserService.removeFriendById(selectedFriendId);
                if (success) location.reload();
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

    static attachUpdateHandler(buttonId: string, formId: string, userId: string): void {
        console.log(`[attachUpdateHandler] Binding button #${buttonId} to form #${formId} for user ${userId}`);
    
        const button = document.getElementById(buttonId);
        const form = document.getElementById(formId) as HTMLFormElement;
    
        if (!button || !form) {
            console.warn(`[attachUpdateHandler] Button or form not found`);
            return;
        }
    
        button.addEventListener('click', async () => {
            console.log('[attachUpdateHandler] Button clicked, preparing submission...');
            const formData = new FormData(form);
            const payload: any = Object.fromEntries(formData.entries());
            console.log('[attachUpdateHandler] Collected payload:', payload);
    
            const password = payload.password as string;
            const confirmPassword = payload.passwordConfirm as string;
            payload.emailVerified = (formData.get('emailVerified') === 'true');
    
            if (password) {
                if (password !== confirmPassword) {
                    alert('Passwords do not match.');
                    return;
                }
            } else {
                delete payload.password;
                delete payload.passwordConfirm;
            }
    
            try {
                console.log('[attachUpdateHandler] Sending update...');
                const success = await UserService.updateUser(userId, payload);
                if (success) {
                    console.log('[attachUpdateHandler] Update successful. Redirecting...');
                    window.location.href = `/users/${userId}`;
                } else {
                    console.error('[attachUpdateHandler] Update failed.');
                }
            } catch (err) {
                console.error('[attachUpdateHandler] Exception during update:', err);
            }
        });
    }

    
}
