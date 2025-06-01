import { generateProfileImage } from '../../utils/Avatar.js';
import AbstractView from '../../utils/AbstractView.js';
import UserService from '../services/UserService.js';
import Card from '../components/Card.js';

export default class Profile extends AbstractView {
	private userId: string;

	constructor(params: URLSearchParams) {
		super();
		this.userId = params.get('id') || 'unknown';
	}

	async getHtml(): Promise<string> {
		const userIdNum = Number(this.userId);
		const userData = isNaN(userIdNum) ? null : await UserService.getUserById(userIdNum);
		const profileImageSvg = userData ? generateProfileImage(userData, 120, 120) : '';

		if (userData) {
			const profileCard = await new Card().renderCard({
				title: `Profile of ${userData.displayname}`,
				contentBlocks: [
					{
						type: 'stat',
						props: {
							label: 'Display Name',
							value: userData.displayname ?? ''
						}
					},
					{
						type: 'stat',
						props: {
							label: 'Username',
							value: userData.username ?? ''
						}
					},
					{
						type: 'stat',
						props: {
							label: 'Email',
							value: userData.email ?? ''
						}
					},
					{
						type: 'stat',
						props: {
							label: 'User ID',
							value: userData.id?.toString() ?? ''
						}
					},
					{
						type: 'buttongroup',
						props: {
							layout: 'stack',
							align: 'center',
							buttons: [
								{
									id: 'edit-profile',
									text: 'Edit Profile',
									href: `/users/edit/${this.userId}`,
								},
								{
									id: 'back-to-list',
									text: 'Back to User List',
									href: '/user-mangement',
									color: 'red'
								}
							]
						}
					}
				]
			});
			return this.render(profileCard);
		} else {
			const errorCard = await new Card().renderCard({
				title: 'User Profile',
				contentBlocks: [
					{
						type: 'container',
						props: {
							html: 'User not found or error loading user data.'
						}
					}
				]
			});
			return this.render(errorCard);
		}
	}
}
