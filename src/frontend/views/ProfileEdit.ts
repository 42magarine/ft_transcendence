import Title from '../components/Title.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';
import Modal from '../components/Modal.js';
import AbstractView from '../../utils/AbstractView.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import UserService from '../services/UserService.js';
import Toggle from '../components/Toggle.js';
import Input from '../components/Input.js';

export default class ProfileEdit extends AbstractView {
	private userId: string;

	constructor(params: URLSearchParams) {
		super();
		this.userId = params.get('id') || 'unknown';
	}

	async getHtml(): Promise<string> {
		let userData = null;

		try {
			const userResponse = await fetch(`/api/users/${this.userId}`);
			if (userResponse.ok) {
				userData = await userResponse.json();
			} else {
				console.error('Failed to fetch user data from API');
			}
		} catch (error) {
			console.error('API request error:', error);
		}

		const title = new Title({
			title: userData ? `Edit Profile: ${userData.displayname}` : 'Edit Profile',
		});
		const titleSection = await title.getHtml();

		const toggle = new Toggle();
		const input = new Input();

		const card = new Card();
		let cardBody = '';

		if (userData) {
			const profileImageSvg = generateProfileImage(userData, 200, 200);

			cardBody = `
				<div class="profile-header">
					<div class="profile-avatar-container">${profileImageSvg}</div>
				</div>
				<div class="profile-details space-y-4">
					${await input.renderInput({
						name: 'displayname',
						placeholder: 'Display Name',
						value: userData.displayname
					})}
					${await input.renderInput({
						name: 'username',
						placeholder: 'Username',
						value: userData.username
					})}
					${await input.renderInput({
						type: 'display',
						name: 'email',
						placeholder: 'Email',
						value: userData.email
					})}
					${await toggle.renderToggle({
						id: 'emailVerified',
						name: 'emailVerified',
						label: 'Email Verified',
						checked: userData.emailVerified
					})}
					${await toggle.renderToggle({
						id: 'twoFAEnabled',
						name: 'twoFAEnabled',
						label: '2FA Enabled',
						checked: userData.twoFAEnabled,
						readonly: true
					})}
					${await toggle.renderToggle({
						id: 'googleSignIn',
						name: 'googleSignIn',
						label: 'Google Sign-In',
						checked: userData.googleSignIn ?? false,
						readonly: true
					})}
					${await input.renderInput({
						id: 'password',
						name: 'password',
						type: 'password',
						placeholder: 'Password',
						withConfirm: true
					})}
				</div>
			`;
		} else {
			cardBody = `<div class="alert alert-warning">User not found or error loading user data.</div>`;
		}

		const cardHtml = await card.renderCard({
			title: 'User Profile',
			body: `<form id="edit-profile-form">${cardBody}
				<div class="text-center mt-6">
					<button type="submit" class="btn btn-success">Update Profile</button>
					<button id="delete-user-btn" type="button" class="btn btn-danger">Delete Profile</button>
				</div>
			</form>`
		});

		const button = new Button();
		const buttonGroup = await button.renderGroup({
			layout: 'stack',
			align: 'center',
			buttons: [
				{
					id: 'back-to-list',
					text: 'Back to User List',
					href: '/user-mangement',
					className: 'btn btn-primary'
				}
			]
		});

		const deleteModal = await new Modal().renderModal({
			id: 'confirm-delete-modal',
			title: 'Confirm Deletion',
			content: `<p>Are you sure you want to delete this user?<br><strong>This action cannot be undone.</strong></p>`,
			footer: `
				<div class="flex justify-end gap-4">
					<button class="btn btn-secondary" onclick="document.getElementById('confirm-delete-modal').classList.add('hidden')">Cancel</button>
					<button id="confirm-delete-btn" class="btn btn-danger">Yes, Delete</button>
				</div>
			`,
			animation: 'scale',
			closableOnOutsideClick: true
		});

		return this.render(`
			<div class="container">
				${titleSection}
				${cardHtml}
				${buttonGroup}
				${deleteModal}
			</div>
		`);
	}

	async mount(): Promise<void>
    {
        UserService.attachProfileFormHandlers('edit-profile-form', this.userId);
        UserService.attachDeleteHandler('delete-user-btn', 'confirm-delete-modal', 'confirm-delete-btn', this.userId);
    }
}

