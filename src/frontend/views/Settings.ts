import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';
import __ from '../services/LanguageService.js';

export default class Settings extends AbstractView {
	constructor() {
		super();
	}

	async getHtml(): Promise<string> {
		const settingsCard = await new Card().renderCard({
			title: __('Profile Settings'),
			formId: 'settings-form',
			contentBlocks: [
				{
					type: 'label',
					props: {
						htmlFor: 'avatar',
						text: __('Avatar')
					}
				},
				{
					type: 'stat',
					props: {
						label: '',
						value: `
							<div class="flex flex-col items-center gap-2">
								<img src="/assets/default-avatar.png" alt="${__('User Avatar')}" class="w-20 h-20 rounded-full border border-white/20" />
								<label class="text-sm text-white/80">${__('Change Avatar')}</label>
								<input type="file" name="avatar" accept="image/*" class="text-white text-xs" />
							</div>
						`
					}
				},
				{
					type: 'label',
					props: {
						htmlFor: 'name',
						text: __('Name')
					}
				},
				{
					type: 'input',
					props: {
						name: 'name',
						type: 'text',
						placeholder: __('John Doe')
					}
				},
				{
					type: 'label',
					props: {
						htmlFor: 'email',
						text: __('Email Address')
					}
				},
				{
					type: 'input',
					props: {
						name: 'email',
						type: 'email',
						placeholder: __('john@example.com')
					}
				},
				{
					type: 'label',
					props: {
						htmlFor: 'language',
						text: __('Preferred Language')
					}
				},
				{
					type: 'stat',
					props: {
						label: '',
						value: `
							<select name="language" class="input-glass w-full bg-white/10 text-white">
								<option value="en">${__('English')}</option>
								<option value="de">${__('German')}</option>
								<option value="fr">${__('French')}</option>
								<option value="ms">${__('Malay')}</option>
							</select>
						`
					}
				},
				{
					type: 'label',
					props: {
						htmlFor: 'darkMode',
						text: __('Dark Mode')
					}
				},
				{
					type: 'toolbar',
					props: {
						buttons: [
							{
								text: `🌙 ${__('Toggle Dark Mode')}`,
								onClick: 'toggleDarkMode()'
							}
						]
					}
				},
				{
					type: 'buttongroup',
					props: {
						layout: 'stack',
						align: 'center',
						buttons: [
							{
								id: 'save-settings',
								text: `💾 ${__('Save Settings')}`,
								onClick: ''
							}
						]
					}
				}
			]
		});

		return this.render(`${settingsCard}`);
	}
}
