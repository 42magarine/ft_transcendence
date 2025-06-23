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
                            { key: 'emailVerified', label: '<i class="fas fa-envelope"></i> Verified' },
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
                console.log('[SUBMIT] Avatar file:', this.avatarFile); // Should already exist
                await window.userManagementService.registerUser(userData, this.avatarFile);
                console.log('[SUBMIT] User registration request sent');
                Router.redirect(location.pathname);
                console.log('[SUBMIT] Redirecting to:', location.pathname);
                createForm.reset();
                console.log('[SUBMIT] Form reset');
                
                // Reset avatar file after form reset
                this.avatarFile = undefined;
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
        
        console.log('[AVATAR] Generating avatar for:', finalText);
        
        try {
            const svg = generateTextVisualization(finalText, {
                width: 100,
                height: 100,
                useShapes: true,
                maxShapes: 50,
                showText: false,
                backgroundColor: '#f0f0f0',
            });
            
            // Debug: Check if SVG is complete and valid
            console.log('[AVATAR] Generated SVG length:', svg.length);
            console.log('[AVATAR] SVG ends with:', svg.slice(-20));
            console.log('[AVATAR] SVG preview:', svg.substring(0, 200) + '...');
            
            // Validate SVG structure
            if (!svg.includes('</svg>')) {
                throw new Error('SVG is incomplete - missing closing tag');
            }
            
            // Test if SVG can be parsed
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
            const parserError = svgDoc.querySelector('parsererror');
            if (parserError) {
                console.error('[AVATAR] SVG parsing error:', parserError.textContent);
                throw new Error('SVG parsing failed: ' + parserError.textContent);
            }
            
            // Clean up any potentially problematic elements
            const svgElement = svgDoc.querySelector('svg');
            if (svgElement) {
                // Ensure proper namespace
                svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                
                // Remove any script tags for security
                const scripts = svgElement.querySelectorAll('script');
                scripts.forEach(script => script.remove());
                
                // Serialize back to clean string
                const serializer = new XMLSerializer();
                const cleanSvg = serializer.serializeToString(svgElement);
                
                console.log('[AVATAR] Cleaned SVG length:', cleanSvg.length);
                
                // Update preview immediately
                avatarPreview.innerHTML = `
                    <div class="w-[80px] h-[80px] rounded-full overflow-hidden shadow bg-white flex items-center justify-center">
                        ${cleanSvg}
                    </div>
                `;
        
                // Create the file directly from cleaned SVG
                const svgBlob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
                const svgFile = new File([svgBlob], `${finalText}.svg`, { type: 'image/svg+xml' });
                this.avatarFile = svgFile;
                
                console.log('[AVATAR] Avatar file created successfully:', this.avatarFile);
            } else {
                throw new Error('No SVG element found in generated content');
            }
            
        } catch (error) {
            console.error('[AVATAR] Error with generateTextVisualization:', error);
            console.error('[AVATAR] Error details:', error instanceof Error ? error.message : String(error));
            
            // Fallback: create a simple colored div as avatar
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
            const color = colors[finalText.charCodeAt(0) % colors.length];
            const initials = finalText.substring(0, 2).toUpperCase();
            
            avatarPreview.innerHTML = `
                <div class="w-[80px] h-[80px] rounded-full flex items-center justify-center text-white font-bold text-lg" style="background-color: ${color}">
                    ${initials}
                </div>
            `;
            
            // Create a simple fallback SVG
            const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" fill="${color}"/>
                <text x="50" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
            </svg>`;
            
            const svgBlob = new Blob([fallbackSvg], { type: 'image/svg+xml;charset=utf-8' });
            this.avatarFile = new File([svgBlob], `${finalText}.svg`, { type: 'image/svg+xml' });
            console.log('[AVATAR] Fallback SVG avatar file created:', this.avatarFile);
        }
    }
}
