import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import { UserList } from '../../interfaces/userManagementInterfaces.js';
import Modal from '../components/Modal.js';
import UserService from '../services/UserService.js';
import Router from '../../utils/Router.js';
import { User } from '../../interfaces/userManagementInterfaces.js';
import { generateTextVisualization } from '../../utils/Avatar.js';

export default class UserManagement extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const users: UserList[] = await UserService.getAllUsers();

        const createUserCard = await new Card().renderCard({
            title: window.ls.__('Create New User'),
            formId: 'create-form',
            prefix: '<div class="create-avatar-preview flex justify-center mb-4"></div>',
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
                            },
                        ]
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
                    type: 'table',
                    props: {
                        id: 'user-list',
                        title: window.ls.__('User Overview'),
                        height: '300px',
                        data: users,
                        columns: [
                            { key: 'id', label: window.ls.__('ID') },
                            { key: 'avatar', label: window.ls.__('Avatar') },
                            { key: 'name', label: window.ls.__('Name') },
                            { key: 'username', label: window.ls.__('Username') },
                            { key: 'email', label: window.ls.__('Email') },
                            { key: 'emailVerified', label: window.ls.__('E-Mail verified') },
                            { key: 'twoFAEnabled', label: window.ls.__('2FA') },
                            { key: 'googleSignIn', label: window.ls.__('Google Sign-In') },
                            { key: 'actions', label: window.ls.__('Actions') }
                        ],
                        rowLayout: (user) => [
                            { type: 'label', props: { text: `${user.id}` } },
                            {
                                type: 'avatar',
                                props: {
                                    src: user.avatar || '',
                                    size: 30,
                                    className: 'mx-auto'
                                }
                            },
                            { type: 'label', props: { text: `${user.name}` } },
                            { type: 'label', props: { text: `${user.username}` } },
                            { type: 'label', props: { text: `${user.email}` } },
                            { type: 'label', props: { text: user.emailVerified ? window.ls.__('Yes') : window.ls.__('No') } },
                            { type: 'label', props: { text: user.twoFAEnabled ? window.ls.__('Yes') : window.ls.__('No') } },
                            { type: 'label', props: { text: user.googleSignIn ? window.ls.__('Yes') : window.ls.__('No') } },
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

        const createForm = document.getElementById('create-form') as HTMLFormElement | null;
        if (createForm) {
            createForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const formData = new FormData(createForm);
                const userData: User = {
                    name: formData.get('name') as string,
                    username: formData.get('username') as string,
                    email: formData.get('email') as string,
                    password: formData.get('password') as string,
                    role: formData.get('role') as string,
                    emailVerified: true,
                    status: 'offline'
                };

                await window.userManagementService.registerUser(userData, (window as any).generatedAvatarFile);
                Router.redirect(location.pathname);
                createForm.reset();
            });
        }

        const usernameInput = document.querySelector('input[name="username"]') as HTMLInputElement | null;
        const avatarPreview = document.querySelector('.create-avatar-preview') as HTMLElement | null;

        if (usernameInput && avatarPreview) {
            const updateAvatarPreview = () => {
                const username = usernameInput.value.trim();
                const finalText = username || 'user';

                const svg = generateTextVisualization(finalText, {
                    width: 100,
                    height: 100,
                    useShapes: true,
                    maxShapes: 50,
                    showText: false,
                    backgroundColor: '#f0f0f0',
                });
                const blob = new Blob([svg], { type: 'image/svg+xml' });
                const file = new File([blob], `${finalText}.svg`, { type: 'image/svg+xml' });
                (window as any).generatedAvatarFile = file;
                console.log('[AVATAR] File created:', file);
                avatarPreview.innerHTML = `
                    <div class="w-[80px] h-[80px] rounded-full overflow-hidden shadow bg-white flex items-center justify-center">
                        ${svg}
                    </div>
                `;
            };
            usernameInput.addEventListener('input', updateAvatarPreview);
            
        }


        const deleteButtons = document.querySelectorAll('[data-user-id]');

        deleteButtons.forEach((btn) => {
            btn.addEventListener('click', async () => {
                const userId = btn.getAttribute('data-user-id');
                if (!userId) return;

                document.getElementById('confirm-delete-modal')?.remove();

                await new Modal().renderDeleteModal({
                    id: 'confirm-delete-modal',
                    userId: userId,
                    onConfirm: async () => {
                        await UserService.deleteUser(Number(userId));
                        Router.redirect(location.pathname);
                        
                    }
                });
                document.getElementById('confirm-delete-modal')?.classList.remove('hidden');
            });
        });
    }
}
