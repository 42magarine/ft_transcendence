// ========================
// File: views/Settings.ts
// ========================

import ThemedView from '../theme/themedView.js';
import Title from '../components/Title.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';
import { ThemeName } from '../theme/themeHelpers.js';

export default class Settings extends ThemedView {
	constructor() {
		super('starship', 'Transcendence - Settings');
	}

	async renderView(): Promise<string> {
		const theme = this.getTheme() as ThemeName;

		// Title using existing params
		const title = await new Title(this.params, {
			title: 'Settings'
		}).getHtml();

		// Button using existing params
		const button = new Button(this.params);
		const saveButtonGroup = await button.renderGroup({
			layout: 'stack',
			align: 'center',
			buttons: [
				{
					id: 'save-settings',
					text: '💾 Save Settings',
					onClick: `console.log('Settings saved')`,
				}
			]
		});

		const avatarHtml = `
			<div class="flex flex-col items-center gap-2">
				<img src="/assets/default-avatar.png" alt="User Avatar" class="w-20 h-20 rounded-full border border-white/20" />
				<label class="text-sm text-white/80">Change Avatar</label>
				<input type="file" name="avatar" accept="image/*" class="text-white text-xs" />
			</div>
		`;

		const card = new Card(this.params);
		const settingsCard = await card.renderCard({
			title: 'Profile Settings',
			formId: 'settings-form',
			contentBlocks: [
				{
					type: 'label',
					props: { htmlFor: 'avatar', text: 'Avatar' }
				},
				{
					type: 'stat',
					props: {
						label: '',
						value: avatarHtml
					}
				},
				{
					type: 'label',
					props: { htmlFor: 'displayName', text: 'Display Name' }
				},
				{
					type: 'input',
					props: { name: 'displayName', placeholder: 'John Doe' }
				},
				{
					type: 'label',
					props: { htmlFor: 'email', text: 'Email Address' }
				},
				{
					type: 'input',
					props: { name: 'email', type: 'email', placeholder: 'john@example.com' }
				},
				{
					type: 'label',
					props: { htmlFor: 'language', text: 'Preferred Language' }
				},
				{
					type: 'stat',
					props: {
						label: '',
						value: `
							<select name="language" class="input-glass w-full bg-white/10 text-white">
								<option value="en">English</option>
								<option value="de">German</option>
								<option value="fr">French</option>
								<option value="ms">Malay</option>
							</select>
						`
					}
				},
				{
					type: 'label',
					props: { htmlFor: 'darkMode', text: 'Dark Mode' }
				},
				{
					type: 'toolbar',
					props: {
						buttons: [
							{ text: '🌙 Toggle Dark Mode', onClick: 'toggleDarkMode()' }
						]
					}
				}
			],
			extra: `<div class="pt-4">${saveButtonGroup}</div>`,
			className: 'max-w-xl mx-auto'
		});

		return this.render(`
			<div class="max-w-5xl mx-auto p-6 space-y-10">
				${settingsCard}
			</div>

			<script>
				window.toggleDarkMode = function () {
					document.documentElement.classList.toggle('dark');
					localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
				}
			</script>
		`);
	}
}
