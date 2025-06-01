import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import UserService from '../services/UserService.js';

export default class ProfileEdit extends AbstractView {
	constructor() {
		super();
	}

	async getHtml(): Promise<string> {
		const user = await UserService.getCurrentUser();

		const profileCard = await new Card().renderCard({
			title: 'Edit Your Profile',
			formId: 'edit-profile-form',
			contentBlocks: [
                {
                    type: 'separator',
                },
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
				{
					type: 'separator',
				},
				{
					type: 'buttongroup',
					props: {
						layout: 'stack',
						align: 'left',
						buttons: [
							{
								text: 'Update Profile',
								type: 'submit',
								className: 'btn btn-green w-full'
							}
						]
					}
				},
				{
					type: 'separator',
				},
				{
					type: 'buttongroup',
					props: {
						layout: 'stack',
						align: 'left',
						buttons: [
							{
								text: 'Deactivate Account',
								type: 'button',
								onClick: 'handleDeactivateAccount()',
								className: 'btn btn-red w-full'
							}
						]
					}
				}
			]
		});

		return this.render(profileCard);
	}
}
