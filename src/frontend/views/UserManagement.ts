// ========================
// File: views/UserManagement.ts
// ========================

import ThemedView from '../theme/themedView.js';
import { ThemeName } from '../theme/themeHelpers.js';
import Title from '../components/Title.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';

export default class UserManagement extends ThemedView {
	constructor() {
		super('stars', 'Transcendence - User Management');
	}

	async renderView(): Promise<string> {
		const theme = this.getTheme() as ThemeName;

		// Title section
		const title = new Title(this.params, {
			title: 'User Management',
		});
		const titleSection = await title.getHtml();

		// Button Group (uses this.params automatically)
		const button = new Button(this.params);
		const readAllButtonGroup = await button.renderGroup({
			layout: 'stack',
			align: 'center',
			buttons: [
				{
					id: 'read-all',
					text: 'Read all Users',
					onClick: `document.getElementById('user-list').innerHTML = '<li>Loading...</li>'`
				}
			]
		});

		// CRUD Form Cards
		const card = new Card(this.params);
		const cardConfigs = [
			{
				title: 'Create User',
				formId: 'create-form',
				inputs: [
					{ name: 'name', placeholder: 'Name' },
					{ name: 'username', placeholder: 'Username' }
				],
				button: { text: 'Create', type: 'submit' }
			},
			{
				title: 'Read One User',
				formId: 'read-one-form',
				inputs: [{ name: 'userId', type: 'number', placeholder: 'User ID' }],
				button: { text: 'Read User', type: 'submit' },
				extra: `<div id="read-result" class="text-white text-sm pt-2"></div>`
			},
			{
				title: 'Update User',
				formId: 'update-form',
				inputs: [
					{ name: 'id', type: 'number', placeholder: 'User ID' },
					{ name: 'name', placeholder: 'New Name' },
					{ name: 'username', placeholder: 'New Username' }
				],
				button: { text: 'Update', type: 'submit' }
			},
			{
				title: 'Delete User',
				formId: 'delete-form',
				inputs: [{ name: 'id', type: 'number', placeholder: 'User ID' }],
				button: { text: 'Delete', type: 'submit', className: 'btn btn-danger btn-sm' },
			}
		];

		// CRUD cards in grid
		const groupedCardHtml = await card.renderGroup({
			layout: 'grid',
			className: 'md:grid-cols-2',
			cards: cardConfigs
		});

		// Read All Users Card
		const readAllCard = await card.renderCard({
			title: 'Read All Users',
			body: `
				<div class="flex flex-col gap-4">
					${readAllButtonGroup}
					<ul id="user-list" class="text-white text-sm pt-2 space-y-1"></ul>
				</div>`,
			className: 'col-span-full text-center'
		});

		// Register Card
		const registerCard = await card.renderCard({
			title: 'Register New Account',
			formId: 'register-form',
			inputs: [
				{ name: 'firstName', placeholder: 'First Name' },
				{ name: 'lastName', placeholder: 'Last Name' },
				{ name: 'email', type: 'email', placeholder: 'Email Address' },
				{ name: 'password', type: 'password', placeholder: 'Password' },
				{ name: 'password', type: 'password', placeholder: 'Password' }
			],
			button: { text: 'Register', type: 'submit' }
		});

		// Final output
		return this.render(`
			<div class="max-w-5xl mx-auto p-6 space-y-8">
				${titleSection}

				<!-- Group: CRUD Cards -->
				${groupedCardHtml}

				<!-- Group: Read All + Register -->
				<div class="flex flex-col items-center gap-6 md:flex-row md:justify-center">
					${readAllCard}
					${registerCard}
				</div>
			</div>

			<script type="module" src="/dist/frontend/services/user_management.js"></script>
		`);
	}
}
