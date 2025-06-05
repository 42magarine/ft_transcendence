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
                                            text: 'Back to User List',
                                            href: '/user-mangement',
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
        UserService.attachProfileFormHandlers('edit-profile-form', this.userId);
    
        const modal = new Modal();
    
        await modal.renderDeleteModal({
            id: 'confirm-delete-modal',
            userId: this.userId,
            onConfirm: async () => {
                try {
                    await UserService.deleteUser(Number(this.userId));
                    window.location.href = '/login'; // or show a toast + redirect
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
