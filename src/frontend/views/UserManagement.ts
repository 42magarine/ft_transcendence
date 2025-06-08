import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import { UserList } from '../../interfaces/userManagementInterfaces.js';
import Modal from '../components/Modal.js';
import UserService from '../services/UserService.js';
import __ from '../services/LanguageService.js';
import Router from '../../utils/Router.js';

export default class UserManagement extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const users: UserList[] = await UserService.getAllUsers();

        const createUserCard = await new Card().renderCard({
            title: window.ls.__('Create New User'),
            formId: 'create-form',
            contentBlocks: [
                {
                    type: 'inputgroup',
                    props: {
                        inputs: [
                            { name: 'name', label: window.ls.__('Name'), placeholder: window.ls.__('Name') },
                            { name: 'username', label: window.ls.__('Username'), placeholder: window.ls.__('Username') },
                            { name: 'email', type: 'email', label: window.ls.__('E-Mail'), placeholder: window.ls.__('E-Mail') },
                            {
                                id: 'password',
                                name: 'password',
                                type: 'password',
                                label: window.ls.__('Password'),
                                placeholder: window.ls.__('Password'),
                                withConfirm: true
                            }
                        ]
                    }
                },
                {
                    type: 'buttongroup',
                    props: {
                        toggles: [
                            { id: 'emailVerified', name: 'emailVerified', label: window.ls.__('Email Verified:'), checked: false },
                            { id: 'twoFAEnabled', name: 'twoFAEnabled', label: window.ls.__('2FA Enabled:'), checked: false },
                            { id: 'googleSignIn', name: 'googleSignIn', label: window.ls.__('Google Sign-In:'), checked: false, readonly: true }
                        ],
                        layout: 'stack',
                        align: 'left'
                    }
                },
                {
                    type: 'buttongroup',
                    props: {
                        buttons: [
                            { text: window.ls.__('Create User'), type: 'submit', className: 'btn btn-green' }
                        ],
                        layout: 'stack',
                        align: 'left'
                    }
                },
                {
                    type: 'label',
                    props: {
                        htmlFor: 'dummy-id',
                        text: ' ' // spacing only
                    }
                },
                {
                    type: 'table',
                    props: {
                        id: 'user-list',
                        title: window.ls.__('User Overview'),
                        height: '300px',
                        data: users,
                        columns: [
                            { key: 'id', label: window.ls.__('ID') },
                            { key: 'name', label: window.ls.__('Name') },
                            { key: 'username', label: window.ls.__('Username') },
                            { key: 'email', label: window.ls.__('Email') },
                            { key: 'emailVerified', label: window.ls.__('Verified') },
                            { key: 'twoFAEnabled', label: window.ls.__('2FA') },
                            { key: 'actions', label: window.ls.__('Actions') }
                        ],
                        rowLayout: (user) => [
                            { type: 'label', props: { text: `${user.id}` } },
                            { type: 'label', props: { text: `${user.name}` } },
                            { type: 'label', props: { text: `${user.username}` } },
                            { type: 'label', props: { text: `${user.email}` } },
                            { type: 'label', props: { text: user.emailVerified ? window.ls.__('Yes') : window.ls.__('No') } },
                            { type: 'label', props: { text: user.twoFAEnabled ? window.ls.__('Enabled') : window.ls.__('Disabled') } },
                            {
                                type: 'buttongroup',
                                props: {
                                    buttons: [
                                        { icon: 'eye', text: window.ls.__('View'), href: `/users/${user.id}` },
                                        { icon: 'pen-to-square', text: window.ls.__('Edit'), href: `/users/edit/${user.id}` },
                                        {
                                            id: `delete-user-btn-${user.id}`,
                                            icon: 'trash',
                                            text: window.ls.__('Delete'),
                                            color: 'red',
                                            dataAttributes: {
                                                'user-id': String(user.id)
                                            },
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        });

        return this.render(`${createUserCard}`);
    }

    async mount(): Promise<void> {
        const users: UserList[] = await UserService.getAllUsers();
        const deleteButtons = document.querySelectorAll('[data-user-id]');

        deleteButtons.forEach((btn) => {
            btn.addEventListener('click', async () => {
                const userId = btn.getAttribute('data-user-id');
                if (!userId) return;

                const user = users.find((u) => String(u.id) === userId);
                if (!user) {
                    console.error(`User with ID ${userId} not found`);
                    return;
                }

                // Remove existing modal if present
                document.getElementById('confirm-delete-modal')?.remove();

                const modal = new Modal();

                await modal.renderDeleteModal({
                    id: 'confirm-delete-modal',
                    userId: userId,
                    onConfirm: async () => {
                        try {
                            await UserService.deleteUser(Number(userId));
                            Router.update();
                        } catch (err) {
                            console.error('Failed to delete user:', err);
                        }
                    }
                });

                document.getElementById('confirm-delete-modal')?.classList.remove('hidden');
            });
        });
    }
}
