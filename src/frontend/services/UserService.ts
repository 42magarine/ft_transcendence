import { User, ApiErrorResponse, FriendList } from '../../interfaces/userManagementInterfaces.js';
import Modal from '../components/Modal.js'

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

    static attachProfileFormHandlers(formId: string, userId: string): void {
        const form = document.getElementById(formId) as HTMLFormElement | null;
        if (!form) {
            console.warn(`Form with ID ${formId} not found`);
            return;
        }
    
        const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement;
        const confirmPasswordRow = document.getElementById('password-confirm-row');
    
        if (passwordInput && confirmPasswordRow) {
            passwordInput.addEventListener('input', () => {
                if (passwordInput.value.trim().length > 0) {
                    confirmPasswordRow.style.display = 'block';
                } else {
                    confirmPasswordRow.style.display = 'none';
                    const confirmInput = confirmPasswordRow.querySelector('input[name="passwordConfirm"]') as HTMLInputElement;
                    if (confirmInput) confirmInput.value = '';
                }
            });
        }
    
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
    
            const formData = new FormData(form);
            const payload: any = Object.fromEntries(formData.entries());
    
            const password = payload.password as string;
            const confirmPassword = payload.passwordConfirm as string;
            payload.emailVerified = (formData.get('emailVerified') === 'true');
    
            if (password) {
                if (password !== confirmPassword) {
                    await new Modal().renderInfoModal({
                        id: 'info-modal-password-mismatch',
                        title: 'Password Mismatch',
                        message: 'Passwords do not match. Please retype them correctly.'
                    });
                    return;
                }
            } else {
                delete payload.password;
                delete payload.passwordConfirm;
            }
    
            // Handle avatar separately
            const avatarInput = form.querySelector('input[name="avatar"]') as HTMLInputElement;
            const avatarFile = avatarInput?.files?.[0];
    
            try {
                let success;
                if (avatarFile && avatarFile.size > 0) {
                    console.log('[ProfileEdit] Avatar file selected:', {
                        name: avatarFile.name,
                        size: avatarFile.size,
                        type: avatarFile.type,
                    });
                
                    const uploadFormData = new FormData();
                
                    for (const [key, value] of Object.entries(payload)) {
                        if (typeof value === 'string' || value instanceof Blob) {
                            console.log(`[FormData] Appending field "${key}" as`, value);
                            uploadFormData.append(key, value);
                        } else {
                            console.log(`[FormData] Coercing and appending field "${key}" as`, String(value));
                            uploadFormData.append(key, String(value));
                        }
                    }
                
                    console.log('[FormData] Appending avatar file');
                    uploadFormData.append('avatar', avatarFile);
                
                    // You can't log FormData directly – log each entry manually
                    for (const pair of uploadFormData.entries()) {
                        console.log(`[FormData] Final entry:`, pair[0], pair[1]);
                    }
                
                    success = await UserService.updateUser(userId, uploadFormData);
                } else {
                    console.log('[ProfileEdit] No avatar selected, removing avatar from payload');
                    delete payload.avatar;
                    console.log('[Payload] Final payload before sending:', payload);
                
                    success = await UserService.updateUser(userId, payload);
                }
                
    
                if (success) {
                    window.location.href = `/users/${userId}`;
                } else {
                    console.error('Failed to update profile.');
                }
            } catch (error) {
                console.error('Update failed:', error);
            }
        });
    }    

    static attachDeleteHandler(buttonId: string, modalId: string, confirmButtonId: string, userId: string): void {
        const deleteBtn = document.getElementById(buttonId);
        const confirmBtn = document.getElementById(confirmButtonId);
        const modal = document.getElementById(modalId);

        if (deleteBtn && modal) {
            deleteBtn.addEventListener('click', () => {
                modal.classList.remove('hidden');
            });
        }

        if (confirmBtn && modal) {
            confirmBtn.addEventListener('click', async () => {
                try {
                    const success = await UserService.deleteUser(Number(userId));
                    if (success) {
                        window.location.href = '/user-mangement';
                    }
                    else {
                        console.error('Failed to delete user.');
                        modal.classList.add('hidden');
                    }
                }
                catch (error) {
                    console.error('Delete failed:', error);
                    modal.classList.add('hidden');
                }
            });
        }
    }
}
