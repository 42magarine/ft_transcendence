import Card from '../components/Card.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import AbstractView from '../../utils/AbstractView.js';
import UserService from '../services/UserService.js';
import Modal from '../components/Modal.js'

export default class ProfileEdit extends AbstractView {
    private userId: string;

    constructor(params: URLSearchParams) {
        super();
        this.userId = params.get('id') || 'unknown';
    }

    async getHtml(): Promise<string> {
        const userIdNum = Number(this.userId);
        const userData = isNaN(userIdNum) ? null : await UserService.getUserById(userIdNum);
        if (!userData) {
            return this.render(`
                <div class="flex justify-center items-center min-h-[80vh] px-4">
                <div class="alert alert-warning text-center">User not found or error loading user data.</div>
                </div>
                `);
            }
        const isMaster = userData.role === 'master';
        const profileEditCard = await new Card().renderCard(
            {
                formId: 'edit-profile-form',
                title: `Edit Profile: ${userData.name}`,
                contentBlocks:
                    [
                        {
                            type: 'avatar',
                            props: {
                                src: generateProfileImage(userData, 100, 100),
                                size: 300
                            }
                        },
                        {
                            type: 'input',
                            props:
                            {
                                name: 'name',
                                placeholder: 'Name',
                                value: userData.name,
                                type: isMaster ? 'display' : 'text'
                            }
                        },
                        {
                            type: 'input',
                            props:
                            {
                                name: 'username',
                                placeholder: 'Username',
                                value: userData.username,
                                type: isMaster ? 'display' : 'text'
                            }
                        },
                        {
                            type: 'input',
                            props:
                            {
                                name: 'email',
                                placeholder: 'Email',
                                value: userData.email,
                                type: 'display'
                            }
                        },
                        {
                            type: 'input',
                            props:
                            {
                                name: 'password',
                                placeholder: 'Password',
                                type: 'password',
                                withConfirm: true
                            }
                        },
                        {
                            type: 'toggle',
                            props:
                            {
                                id: 'emailVerified',
                                name: 'emailVerified',
                                label: 'Email Verified',
                                checked: !!userData.emailVerified
                            }
                        },
                        {
                            type: 'toggle',
                            props:
                            {
                                id: 'twoFAEnabled',
                                name: 'twoFAEnabled',
                                label: '2FA Enabled',
                                checked: !!userData.twoFAEnabled,
                                readonly: true
                            }
                        },
                        {
                            type: 'toggle',
                            props:
                            {
                                id: 'googleSignIn',
                                name: 'googleSignIn',
                                label: 'Google Sign-In',
                                checked: !!userData.googleSignIn,
                                readonly: true
                            }
                        },
                        {
                            type: 'buttongroup',
                            props:
                            {
                                layout: 'group',
                                align: 'center',
                                buttons:
                                    [
                                        {
                                            id: 'submit-profile',
                                            text: 'Update Profile',
                                            type: 'submit',
                                            className: 'btn btn-green'
                                        },
                                        {
                                            id: 'delete-user-btn',
                                            text: 'Delete Profile',
                                            type: 'button',
                                            className: 'btn btn-red'
                                        }
                                    ]
                            }
                        },
                        {
                            type: 'buttongroup',
                            props:
                            {
                                layout: 'stack',
                                align: 'center',
                                buttons:
                                    [
                                        {
                                            id: 'back-to-list',
                                            text: isMaster ? 'Back to User List' : 'Back to Profile',
                                            href: isMaster ? '/user-mangement' : `/users/${userData.id}`,
                                            className: 'btn btn-primary'
                                        }
                                    ]
                            }
                        },
                    ]
            });
        return this.render(`${profileEditCard}`);
    }

    async mount(): Promise<void> {
        const form = document.getElementById('edit-profile-form') as HTMLFormElement | null;
        if (!form) {
            console.warn(`Form with ID edit-profile-form not found`);
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
    
            payload.emailVerified = (formData.get('emailVerified') === 'true');
    
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
    
                    for (const pair of uploadFormData.entries()) {
                        console.log(`[FormData] Final entry:`, pair[0], pair[1]);
                    }
    
                    success = await UserService.updateUser(this.userId, uploadFormData);
                } else {
                    console.log('[ProfileEdit] No avatar selected, removing avatar from payload');
                    delete payload.avatar;
                    console.log('[Payload] Final payload before sending:', payload);
    
                    success = await UserService.updateUser(this.userId, payload);
                }
    
                if (success) {
                    window.location.href = `/users/${this.userId}`;
                } else {
                    console.error('Failed to update profile.');
                }
            } catch (error) {
                console.error('Update failed:', error);
            }
        });
    
        // Setup modal for deletion
        const modal = new Modal();
    
        await modal.renderDeleteModal({
            id: 'confirm-delete-modal',
            userId: this.userId,
            onConfirm: async () => {
                try {
                    await UserService.deleteUser(Number(this.userId));
                    window.location.href = '/login';
                } catch (error) {
                    console.error(error);
                }
            }
        });
    
        document.getElementById('delete-user-btn')?.addEventListener('click', () => {
            document.getElementById('confirm-delete-modal')?.classList.remove('hidden');
        });
    }
}
