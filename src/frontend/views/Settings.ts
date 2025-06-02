import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';

export default class Settings extends AbstractView
{
    constructor()
    {
        super();
    }

    async getHtml(): Promise<string>
    {
        const settingsCard = await new Card().renderCard(
        {
            title: 'Profile Settings',
            formId: 'settings-form',
            contentBlocks:
            [
                {
                    type: 'label',
                    props:
                    {
                        htmlFor: 'avatar',
                        text: 'Avatar'
                    }
                },
                {
                    type: 'stat',
                    props:
                    {
                        label: '',
                        value: `
                            <div class="flex flex-col items-center gap-2">
                                <img src="/assets/default-avatar.png" alt="User Avatar" class="w-20 h-20 rounded-full border border-white/20" />
                                <label class="text-sm text-white/80">Change Avatar</label>
                                <input type="file" name="avatar" accept="image/*" class="text-white text-xs" />
                            </div>
                        `
                    }
                },
                {
                    type: 'label',
                    props:
                    {
                        htmlFor:
                        'Name',
                        text: 'Name'
                    }
                },
                {
                    type: 'input',
                    props:
                    {
                        name: 'Name',
                        type: "text",
                        placeholder: 'John Doe'
                    }
                },
                {
                    type: 'label',
                    props:
                    {
                        htmlFor: 'email',
                        text: 'Email Address'
                    }
                },
                {
                    type: 'input',
                    props:
                    { name: 'email',
                        type: 'email',
                        placeholder: 'john@example.com'
                    }
                },
                {
                    type: 'label',
                    props:
                    {
                        htmlFor: 'language',
                        text: 'Preferred Language'
                    }
                },
                {
                    type: 'stat',
                    props:
                    {
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
                    props:
                    {
                        htmlFor: 'darkMode',
                        text: 'Dark Mode'
                    }
                },
                {
                    type: 'toolbar',
                    props:
                    {
                        buttons:
                        [
                            {
                                text: '🌙 Toggle Dark Mode',
                                onClick: 'toggleDarkMode()'
                            }
                        ]
                    }
                },
                {
                    type: 'buttongroup',
                    props:
                    {
                        layout: 'stack',
                        align: 'center',
                        buttons:
                        [
                            {
                                id: 'save-settings',
                                text: '💾 Save Settings',
                                onClick: ``,
                            }
                        ]
                    }
                }
            ],
        });

        return this.render(`${settingsCard}`);
    }
}
