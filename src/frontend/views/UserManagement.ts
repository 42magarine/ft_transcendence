import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import { UserList } from '../../interfaces/userManagementInterfaces.js';
import Modal from '../components/Modal.js';
import UserService from '../services/UserService.js';

export default class UserManagement extends AbstractView {
	constructor() {
		super();
	}

	async getHtml(): Promise<string> {
		const users: UserList[] = await UserService.getAllUsers();

		const createUserCard = await new Card().renderCard({
			title: 'Create New User',
			formId: 'create-form',
			contentBlocks: [
				{
					type: 'inputgroup',
					props: {
						inputs: [
							{ name: 'name', label: 'Name', placeholder: 'Name' },
							{ name: 'username', label: 'Username', placeholder: 'Username' },
							{ name: 'email', type: 'email', label: 'E-Mail', placeholder: 'E-Mail' },
							{ id: 'password', name: 'password', type: 'password', label: 'Password', placeholder: 'Password', withConfirm: true }
						]
					}
				},
				{
					type: 'buttongroup',
					props: {
						toggles: [
							{ id: 'emailVerified', name: 'emailVerified', label: 'Email Verified:', checked: false },
							{ id: 'twoFAEnabled', name: 'twoFAEnabled', label: '2FA Enabled:', checked: false },
							{ id: 'googleSignIn', name: 'googleSignIn', label: 'Google Sign-In:', checked: false, readonly: true }
						],
						layout: 'stack',
						align: 'left'
					}
				},
				{
					type: 'buttongroup',
					props: {
						buttons: [
							{ text: 'Create User', type: 'submit', className: 'btn btn-green' }
						],
						layout: 'stack',
						align: 'left'
					}
				},
				{
					type: 'label',
					props: {
						htmlFor: 'dummy-id',
						text: ' '
					}
				},
				{
					type: 'table',
					props: {
						id: 'user-list',
						title: 'User Overview',
						height: '300px',
						data: users,
						columns: [
							{ key: 'id', label: 'ID' },
							{ key: 'name', label: 'Name' },
							{ key: 'username', label: 'Username' },
							{ key: 'email', label: 'Email' },
							{ key: 'emailVerified', label: 'Verified' },
							{ key: 'twoFAEnabled', label: '2FA' },
							{ key: 'actions', label: 'Actions' }
						],
						rowLayout: (user) => [
							{ type: 'label', props: { text: `${user.id}` } },
							{ type: 'label', props: { text: `${user.name}` } },
							{ type: 'label', props: { text: `${user.username}` } },
							{ type: 'label', props: { text: `${user.email}` } },
							{ type: 'label', props: { text: user.emailVerified ? 'Yes' : 'No' } },
							{ type: 'label', props: { text: user.twoFAEnabled ? 'Enabled' : 'Disabled' } },
							{
								type: 'buttongroup',
								props: {
									buttons: [
										{ icon: 'eye', text: 'View', href: `/users/${user.id}` },
										{ icon: 'pen-to-square', text: 'Edit', href: `/users/edit/${user.id}` },
										{
                                            id: `delete-user-btn-${user.id}`,
                                            icon: 'trash',
                                            text: 'Delete',
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
                            window.location.reload();
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
