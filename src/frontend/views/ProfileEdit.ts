import Card from '../components/Card.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import AbstractView from '../../utils/AbstractView.js';
import UserService from '../services/UserService.js';

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
        const profileImageSvg = generateProfileImage(userData, 100, 100);

        const profileEditCard = await new Card().renderCard(
            {
                formId: 'edit-profile-form',
                title: `Edit Profile: ${userData.name}`,
                contentBlocks:
                    [
                        {
                            type: 'container',
                            props: {
                                className: 'flex justify-center my-4',
                                html: profileImageSvg
                            }
                        },
                        {
                            type: 'input',
                            props:
                            {
                                name: 'name',
                                placeholder: 'Name',
                                value: userData.name
                            }
                        },
                        {
                            type: 'input',
                            props:
                            {
                                name: 'username',
                                placeholder: 'Username',
                                value: userData.username
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
                        {
                            type: 'html',
                            props:
                            {
                                html: `
                            <div id="confirm-delete-modal" class="modal hidden fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                                <div class="bg-white p-6 rounded-lg max-w-sm w-full shadow-lg animate-scale">
                                    <h2 class="text-lg font-bold mb-4">Confirm Deletion</h2>
                                    <p>Are you sure you want to delete this user?<br><strong>This action cannot be undone.</strong></p>
                                    <div class="flex justify-end gap-4 mt-6">
                                        <button class="btn btn-secondary" onclick="document.getElementById('confirm-delete-modal').classList.add('hidden')">Cancel</button>
                                        <button id="confirm-delete-btn" class="btn btn-red">Yes, Delete</button>
                                    </div>
                                </div>
                            </div>
                        `
                            }
                        }
                    ]
            });
        return this.render(`${profileEditCard}`);
    }
}
