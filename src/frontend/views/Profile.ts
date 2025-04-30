import ThemedView from '../theme/themedView.js';
import { ThemeName } from '../theme/themeHelpers.js';
import Title from '../components/Title.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';
import { generateTextVisualization } from '../../utils/Avartar.js'; // Import the visualization library

export default class Profile extends ThemedView {
	private userId: string;

	constructor(params: URLSearchParams) {
		super('stars', 'Transcendence - Profile');
		// Extract the id parameter from the route params
		this.userId = params.get('id') || 'unknown';
	}

	/**
	 * Generates a profile image SVG based on user data
	 */
	private generateProfileImage(userData: any): string {
		// Create a seed from user data - concatenate displayname, username and email
		const seed = `${userData.displayname}`;

		// Generate the visualization with appropriate options
		return generateTextVisualization(seed, {
			width: 200,
			height: 200,
			useShapes: true,
			maxShapes: 50,
			showText: false, // Don't show the text in the image
			backgroundColor: '#f0f0f0'
		});
	}

	async renderView(): Promise<string> {
		const theme = this.getTheme() as ThemeName;

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
		const title = new Title(this.params, {
			title: userData ? `Profile: ${userData.displayname}` : 'User Profile',
		});
		const titleSection = await title.getHtml();

		// User profile card
		const card = new Card(this.params);

		let profileCardHtml = '';
		let profileImageSvg = '';

		if (userData) {
			// Generate the profile image SVG
			profileImageSvg = this.generateProfileImage(userData);

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
		const button = new Button(this.params);
		const buttonGroup = await button.renderGroup({
			layout: 'stack',
			align: 'center',
			buttons: [
				{
					id: 'edit-profile',
					text: 'Edit Profile',
					href: '/users/edit/' + this.userId
				},
				{
					id: 'back-to-list',
					text: 'Back to User List',
					href: '/user-mangement'
				}
			]
		});

		// Add CSS for the SVG avatar
		const customStyles = `
		<style>
			.profile-avatar-container {
				width: 200px;
				height: 200px;
				margin: 0 auto 1rem auto;
				border-radius: 50%;
				overflow: hidden;
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
			}
			.profile-avatar-container svg {
				width: 100%;
				height: 100%;
				border-radius: 50%;
			}
			.profile-header {
				text-align: center;
				margin-bottom: 2rem;
			}
			.profile-details {
				max-width: 500px;
				margin: 0 auto;
			}
			.detail-row {
				display: flex;
				justify-content: space-between;
				padding: 0.5rem 0;
				border-bottom: 1px solid #eee;
			}
			.label {
				font-weight: bold;
				color: #666;
			}
		</style>
		`;

		// Final output
		return this.render(`
            ${customStyles}
            <div class="container">
                ${titleSection}
                ${profileCardHtml}
                ${buttonGroup}
            </div>
        `);
	}
}