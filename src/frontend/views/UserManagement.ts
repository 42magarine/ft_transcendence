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
    avatarFile: File | undefined = undefined;

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
                            { key: 'id', label: '<i class="fas fa-fingerprint"></i>' },
                            { key: 'avatar', label: '<i class="fas fa-user-circle"></i>' },
                            { key: 'name', label: '<i class="fas fa-user"></i>' },
                            { key: 'username', label: '<i class="fas fa-user-tag"></i>' },
                            { key: 'email', label: '<i class="fas fa-envelope"></i>' },
                            { key: 'emailVerified', label: '<i class="fas fa-check-circle text-green-500"></i> Verified' },
                            { key: 'twoFAEnabled', label: '<i class="fas fa-lock"></i> 2FA' },
                            { key: 'googleSignIn', label: '<i class="fab fa-google"></i>' },
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
                            { type: 'label', props: { text: `${user.email.slice(0, 10)}…` } },
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
        console.log('[MOUNT] Mounting UserManagement view...');
    
        const createForm = document.getElementById('create-form') as HTMLFormElement | null;
        const usernameInput = document.querySelector('input[name="username"]') as HTMLInputElement | null;
        const avatarPreview = document.querySelector('.create-avatar-preview') as HTMLElement | null;
    
        console.log('[MOUNT] Form found:', !!createForm);
        console.log('[MOUNT] Username input found:', !!usernameInput);
        console.log('[MOUNT] Avatar preview container found:', !!avatarPreview);

        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                console.log('[EVENT] Username input changed');
                this.updateAvatarPreview();
            });
        }
    
        if (createForm) {
            createForm.addEventListener('submit', async (e) => {
                console.log('[SUBMIT] Form submission triggered');
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
            
                console.log('[SUBMIT] Form data:', userData);
                await this.updateAvatarPreview();
                console.log('[SUBMIT] Avatar file after await:', this.avatarFile);
                await window.userManagementService.registerUser(userData, this.avatarFile);
                console.log('[SUBMIT] User registration request sent');
                Router.redirect(location.pathname);
                console.log('[SUBMIT] Redirecting to:', location.pathname);
                createForm.reset();
                console.log('[SUBMIT] Form reset');
            });
        }
    
        const deleteButtons = document.querySelectorAll('[data-user-id]');
        console.log(`[DELETE] Found ${deleteButtons.length} delete buttons`);
    
        deleteButtons.forEach((btn) => {
            btn.addEventListener('click', async () => {
                const userId = btn.getAttribute('data-user-id');
                console.log('[DELETE] Button clicked for user:', userId);
                if (!userId) {
                    console.warn('[DELETE] No user ID found on button');
                    return;
                }
    
                document.getElementById('confirm-delete-modal')?.remove();
                await new Modal().renderDeleteModal({
                    id: 'confirm-delete-modal',
                    userId: userId,
                    onConfirm: async () => {
                        console.log('[DELETE] Confirming deletion for user:', userId);
                        await UserService.deleteUser(Number(userId));
                        Router.redirect(location.pathname);
                    }
                });
                document.getElementById('confirm-delete-modal')?.classList.remove('hidden');
            });
        });
    }

    private async updateAvatarPreview(): Promise<void> {
        const usernameInput = document.querySelector('input[name="username"]') as HTMLInputElement | null;
        const avatarPreview = document.querySelector('.create-avatar-preview') as HTMLElement | null;
        if (!usernameInput || !avatarPreview) return;

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

        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const pngFile = new File([blob], `${finalText}.png`, { type: 'image/png' });
                        this.avatarFile = pngFile;
                    }
                }, 'image/png');
            }
            URL.revokeObjectURL(url);
        };

        img.src = url;
        avatarPreview.innerHTML = `
            <div class="w-[80px] h-[80px] rounded-full overflow-hidden shadow bg-white flex items-center justify-center">
                ${svg}
            </div>
        `;
    }
}
