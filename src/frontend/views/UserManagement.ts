import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import { UserList } from '../../interfaces/userManagementInterfaces.js';
import Modal from '../components/Modal.js';
import UserService from '../services/UserService.js';
import __ from '../services/LanguageService.js';

export default class UserManagement extends AbstractView {
	constructor() {
		super();
	}

	async getHtml(): Promise<string> {
		const users: UserList[] = await UserService.getAllUsers();

		const createUserCard = await new Card().renderCard({
			title: __('Create New User'),
			formId: 'create-form',
			contentBlocks: [
				{
					type: 'inputgroup',
					props: {
						inputs: [
							{ name: 'name', label: __('Name'), placeholder: __('Name') },
							{ name: 'username', label: __('Username'), placeholder: __('Username') },
							{ name: 'email', type: 'email', label: __('E-Mail'), placeholder: __('E-Mail') },
							{
								id: 'password',
								name: 'password',
								type: 'password',
								label: __('Password'),
								placeholder: __('Password'),
								withConfirm: true
							}
						]
					}
				},
				{
					type: 'buttongroup',
					props: {
						toggles: [
							{ id: 'emailVerified', name: 'emailVerified', label: __('Email Verified:'), checked: false },
							{ id: 'twoFAEnabled', name: 'twoFAEnabled', label: __('2FA Enabled:'), checked: false },
							{ id: 'googleSignIn', name: 'googleSignIn', label: __('Google Sign-In:'), checked: false, readonly: true }
						],
						layout: 'stack',
						align: 'left'
					}
				},
				{
					type: 'buttongroup',
					props: {
						buttons: [
							{ text: __('Create User'), type: 'submit', className: 'btn btn-green' }
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
						title: __('User Overview'),
						height: '300px',
						data: users,
						columns: [
							{ key: 'id', label: __('ID') },
							{ key: 'name', label: __('Name') },
							{ key: 'username', label: __('Username') },
							{ key: 'email', label: __('Email') },
							{ key: 'emailVerified', label: __('Verified') },
							{ key: 'twoFAEnabled', label: __('2FA') },
							{ key: 'actions', label: __('Actions') }
						],
						rowLayout: (user) => [
							{ type: 'label', props: { text: `${user.id}` } },
							{ type: 'label', props: { text: `${user.name}` } },
							{ type: 'label', props: { text: `${user.username}` } },
							{ type: 'label', props: { text: `${user.email}` } },
							{ type: 'label', props: { text: user.emailVerified ? __('Yes') : __('No') } },
							{ type: 'label', props: { text: user.twoFAEnabled ? __('Enabled') : __('Disabled') } },
							{
								type: 'buttongroup',
								props: {
									buttons: [
										{ icon: 'eye', text: __('View'), href: `/users/${user.id}` },
										{ icon: 'pen-to-square', text: __('Edit'), href: `/users/edit/${user.id}` },
										{
											id: `delete-user-btn-${user.id}`,
											icon: 'trash',
											text: __('Delete'),
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
