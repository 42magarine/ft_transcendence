import Card from '../components/Card.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import AbstractView from '../../utils/AbstractView.js';
import UserService from '../services/UserService.js';
import Modal from '../components/Modal.js';
import __ from '../services/LanguageService.js';
import Router from '../../utils/Router.js';

export default class ProfileEdit extends AbstractView {
    private userId: string;
    private originalUsername: string = '';

    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
        this.userId = routeParams["id"];
    }
    
    async getHtml(): Promise<string> {
        const userIdNum = Number(this.userId);
        const userData = isNaN(userIdNum) ? null : await UserService.getUserById(userIdNum);
        if (!userData) {
            return this.render(`
                <div class="flex justify-center items-center min-h-[80vh] px-4">
                <div class="alert alert-warning text-center">${window.ls.__('User not found or error loading user data.')}</div>
                </div>
            `);
        }
        this.originalUsername = userData?.username ?? '';
        const isMaster = userData.role === 'master';

        const profileEditCard = await new Card().renderCard({
            formId: 'edit-profile-form',
            title: `${window.ls.__('Edit Profile')}: ${userData.name}`,
            contentBlocks: [
                {
                    type: 'avatar',
                    props: {
                        src: generateProfileImage(userData, 100, 100),
                        size: 300
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'name',
                        placeholder: window.ls.__('Name'),
                        value: userData.name,
                        type: isMaster ? 'display' : 'text'
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'username',
                        placeholder: window.ls.__('Username'),
                        value: userData.username,
                        type: 'display'
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'email',
                        placeholder: window.ls.__('Email'),
                        value: userData.email,
                        type: 'display'
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'password',
                        placeholder: window.ls.__('Password'),
                        type: 'password',
                        withConfirm: true
                    }
                },
                {
                    type: 'toggle',
                    props: {
                        id: 'emailVerified',
                        name: 'emailVerified',
                        label: window.ls.__('Email Verified'),
                        checked: !!userData.emailVerified,
                        readonly: true
                    }
                },
                {
                    type: 'buttongroup',
                    props: {
                        layout: 'group',
                        align: 'center',
                        buttons: [
                            {
                                id: 'submit-profile',
                                text: window.ls.__('Update Profile'),
                                type: 'submit',
                                className: 'btn btn-green'
                            },
                            {
                                id: 'delete-user-btn',
                                text: window.ls.__('Delete Profile'),
                                type: 'button',
                                className: 'btn btn-red'
                            }
                        ]
                    }
                },
                {
                    type: 'buttongroup',
                    props: {
                        layout: 'stack',
                        align: 'center',
                        buttons: [
                            {
                                id: 'back-to-list',
                                text: isMaster ? window.ls.__('Back to User List') : window.ls.__('Back to Profile'),
                                href: isMaster ? '/user-mangement' : `/users/${userData.id}`,
                                className: 'btn btn-primary'
                            }
                        ]
                    }
                }
            ]
        });
        return this.render(`${profileEditCard}`);
    }

    async mount(): Promise<void> {
        const form = document.getElementById('edit-profile-form') as HTMLFormElement | null;
        if (!form) {
            console.log(`Form with ID edit-profile-form not found`);
            return;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
        
            const formData = new FormData(form);
            const payload: any = Object.fromEntries(formData.entries());
        
            const password = formData.get('password')?.toString().trim() || '';
            const confirmPassword = formData.get('passwordConfirm')?.toString().trim() || '';
        
            if (password !== confirmPassword || (!password && confirmPassword) || (password && !confirmPassword)) {
                await new Modal().renderInfoModal({
                    id: 'password-mismatch-modal',
                    title: window.ls.__('Validation Error'),
                    message: window.ls.__('Passwords do not match.')
                });
                return;
            }
            if (!password && !confirmPassword)
                delete payload.password;
            else
                payload.password = password;
            delete payload.passwordConfirm;
            const avatarInput = form.querySelector('input[name="avatar"]') as HTMLInputElement;
            const avatarFile = avatarInput?.files?.[0];

            const name = formData.get('name')?.toString().trim() || '';
            if (name == this.originalUsername)
                delete payload.name;
            if (Object.keys(payload).length === 0) {
                return;
            }            
            try {
                let success;
                if (avatarFile && avatarFile.size > 0) {
                    const uploadFormData = new FormData();
        
                    for (const [key, value] of Object.entries(payload)) {
                        uploadFormData.append(key, String(value));
                    }
        
                    uploadFormData.append('avatar', avatarFile);
                    console.log(uploadFormData);
                    success = await UserService.updateUser(this.userId, uploadFormData);
                } else {
                    delete payload.avatar;
                    console.log(payload);
                    success = await UserService.updateUser(this.userId, payload);
                }
        
                if (success) {
                    Router.redirect(`/users/${this.userId}`);
                } else {
                    console.error('Failed to update profile.');
                }
            } catch (error) {
                console.error('Update failed:', error);
            }
        });        

        document.getElementById('delete-user-btn')?.addEventListener('click', async () =>
            {
                console.log('[DeleteUser] Delete button clicked.');
            
                // Always remove any existing modal to keep logic clean
                document.getElementById('confirm-delete-modal')?.remove();
            
                const modal = new Modal();
            
                await modal.renderDeleteModal({
                    id: 'confirm-delete-modal',
                    userId: this.userId,
                    onConfirm: async () =>
                    {
                        console.log('[DeleteUser] Confirm delete triggered.');
                        try
                        {
                            const success = await UserService.deleteUser(Number(this.userId));
                            console.log('[DeleteUser] Delete success:', success);
                            Router.redirect('/login');
                        }
                        catch (error)
                        {
                            console.log('[DeleteUser] Error during deletion:', error);
                        }
                    }
                });
            
                document.getElementById('confirm-delete-modal')?.classList.remove('hidden');
            });            
    }
}
