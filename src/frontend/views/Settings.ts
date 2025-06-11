import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';
import __ from '../services/LanguageService.js';

export default class Settings extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const settingsCard = await new Card().renderCard({
            title: window.ls.__('Profile Settings'),
            formId: 'settings-form',
            contentBlocks: [
                {
                    type: 'label',
                    props: {
                        htmlFor: 'avatar',
                        text: window.ls.__('Avatar')
                    }
                },
                {
                    type: 'stat',
                    props: {
                        label: '',
                        value: `
							<div class="flex flex-col items-center gap-2">
								<img src="/assets/default-avatar.png" alt="${window.ls.__('User Avatar')}" class="w-20 h-20 rounded-full border border-white/20" />
								<label class="text-sm text-white/80">${window.ls.__('Change Avatar')}</label>
								<input type="file" name="avatar" accept="image/*" class="text-white text-xs" />
							</div>
						`
                    }
                },
                {
                    type: 'label',
                    props: {
                        htmlFor: 'name',
                        text: window.ls.__('Name')
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'name',
                        type: 'text',
                        placeholder: window.ls.__('John Doe')
                    }
                },
                {
                    type: 'label',
                    props: {
                        htmlFor: 'email',
                        text: window.ls.__('Email Address')
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'email',
                        type: 'email',
                        placeholder: window.ls.__('john@example.com')
                    }
                },
                {
                    type: 'label',
                    props: {
                        htmlFor: 'language',
                        text: window.ls.__('Preferred Language')
                    }
                },
                {
                    type: 'stat',
                    props: {
                        label: '',
                        value: `
							<select name="language" class="input-glass w-full bg-white/10 text-white">
								<option value="en">${window.ls.__('English')}</option>
								<option value="de">${window.ls.__('German')}</option>
								<option value="fr">${window.ls.__('French')}</option>
								<option value="ms">${window.ls.__('Malay')}</option>
							</select>
						`
                    }
                },
                {
                    type: 'label',
                    props: {
                        htmlFor: 'darkMode',
                        text: window.ls.__('Dark Mode')
                    }
                },
                {
                    type: 'toolbar',
                    props: {
                        buttons: [
                            {
                                text: `🌙 ${window.ls.__('Toggle Dark Mode')}`,
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
                                text: `💾 ${window.ls.__('Save Settings')}`,
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
