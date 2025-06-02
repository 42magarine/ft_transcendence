import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import UserService from '../services/UserService.js';

export default class ProfileEdit extends AbstractView {
	constructor(params: URLSearchParams) {
		super(params);
	}	

	async getHtml(): Promise<string> {
		const userId = Number(this.params.get('id'));
		const user = await UserService.getUserById(userId);

		const profileCard = await new Card().renderCard({
			title: 'Edit Your Profile',
			formId: `edit_profile_form/${userId}`, // ✅ Unique form ID
			contentBlocks: [
				{ type: 'separator' },
				{
					type: 'inputgroup',
					props: {
						inputs: [
							{
								name: 'displayname',
								type: 'text',
								label: 'Display Name',
								placeholder: 'Your full name',
								value: user?.displayname ?? ''
							},
							{
								name: 'username',
								type: 'text',
								label: 'Username',
								placeholder: 'Unique username',
								value: user?.username ?? ''
							},
							{
								name: 'email',
								type: 'email',
								label: 'Email',
								placeholder: 'you@example.com',
								value: user?.email ?? ''
							},
							{
								name: 'password',
								type: 'password',
								label: 'New Password',
								placeholder: 'Leave blank to keep current password',
								withConfirm: true
							}
						]
					}
				},
				{ type: 'separator' },
				{
					type: 'buttongroup',
					props: {
						layout: 'stack',
						align: 'left',
						buttons: [
							{
								id: `submit-profile-btn-${userId}`,  // ✅ Unique submit button ID
								text: 'Update Profile',
								color: 'green',
								className: 'w-full'
							}
						]
					}
				},
				{ type: 'separator' },
				{
					type: 'buttongroup',
					props: {
						layout: 'stack',
						align: 'left',
						buttons: [
							{
								text: 'Deactivate Account',
								onClick: 'handleDeactivateAccount()',
								color: 'red',
								className: 'btn btn-red w-full'
							}
						]
					}
				}
			]
		});

		return this.render(profileCard);
	}

	onMounted(): void {
		const userId = this.params.get('id');
		if (userId) {
			UserService.attachUpdateHandler(`submit-profile-btn-${userId}`, `edit_profile_form/${userId}`, userId);
		}
	}
}
