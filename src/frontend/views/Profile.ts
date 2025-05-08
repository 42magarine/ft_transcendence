import Title from '../components/Title.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';
import { generateProfileImage } from '../../utils/Avartar.js';
import AbstractView from '../../utils/AbstractView.js';

export default class Profile extends AbstractView {
	private userId: string;

	constructor(params: URLSearchParams) {
		super();
		// Extract the id parameter from the route params
		this.userId = params.get('id') || 'unknown';
	}

	async getHtml(): Promise<string> {

		// User data will be stored here
		let userData = null;
		let users = [];

		try {
			// First, fetch the specific user using the userId from the route parameters
			const userResponse = await fetch(`/api/users/${this.userId}`);
			if (userResponse.ok) {
				userData = await userResponse.json();
				console.log('User data loaded:', userData);
			} else {
				console.error('Failed to fetch user data from API');
			}
		} catch (error) {
			console.error('API request error:', error);
		}

		// Title section
		const title = new Title({
			title: userData ? `Profile: ${userData.displayname}` : 'User Profile',
		});
		const titleSection = await title.getHtml();

		// User profile card
		const card = new Card();

		let profileCardHtml = '';
		let profileImageSvg = '';

		if (userData) {
			// Generate the profile image SVG
			profileImageSvg = generateProfileImage(userData, 200, 200);

			profileCardHtml = await card.renderCard({
				title: 'User Profile',
				extra: `
                <div class="profile-container">
                    <div class="profile-header">
                        <div class="profile-avatar-container">
                            ${profileImageSvg}
                        </div>
                        <h2>${userData.displayname}</h2>
                        <p class="username">@${userData.username}</p>
                    </div>
                    <div class="profile-details">
                        <div class="detail-row">
                            <span class="label">Email:</span>
                            <span class="value">${userData.email}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">User ID:</span>
                            <span class="value">${userData.id}</span>
                        </div>
                        <!-- Add more user details as needed -->
                    </div>
                </div>`,
				data: { user: userData }
			});
		} else {
			profileCardHtml = await card.renderCard({
				title: 'User Profile',
				extra: `<div class="alert alert-warning">User not found or error loading user data.</div>`
			});
		}

		// Button for edit
		const button = new Button();
		const buttonGroup = await button.renderGroup({
			layout: 'stack',
			align: 'center',
			buttons: [
				{
					id: 'edit-profile',
					text: 'Edit Profile',
					href: '/users/edit/' + this.userId,
					className: 'btn btn-primary'
				},
				{
					id: 'back-to-list',
					text: 'Back to User List',
					href: '/user-mangement',
					className: 'btn btn-primary'
				}
			]
		});

		// Final output
		return this.render(`
            <div class="container">
                ${titleSection}
                ${profileCardHtml}
                ${buttonGroup}
            </div>
        `);
	}
}