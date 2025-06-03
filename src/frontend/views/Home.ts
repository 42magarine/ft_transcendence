import UserService from '../services/UserService.js';
import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Router from '../../utils/Router.js';

export default class Home extends AbstractView
{
    constructor()
    {
        super();
    }

    async getHtml(): Promise<string>
    {
        const currentUser = await UserService.getCurrentUser();
        if (!currentUser)
            Router.redirect('/login');

        // Card to demonstrate all available content block types
        const homeCard = await new Card().renderCard(
        {
            title: currentUser
                ? `Hello ${currentUser.displayname}, this is Transcendence, please don't delete this card, it is for testing purpose!`
                : 'Welcome to Transcendence!',
            formId: 'test-form',
            contentBlocks:
            [
                {
                    type: 'button',
                    props:
                    {
                        text: 'Max',
                        type: 'button',
                        color: 'red'
                    }
                },
                // LABEL + TEXT INPUT
                {
                    type: 'label',
                    props:
                    {
                        htmlFor: 'fullName',
                        text: 'Full Name'
                    }
                },
                {
                    type: 'input',
                    props:
                    {
                        name: 'fullName',
                        type: 'text',
                        placeholder: 'Enter your name',
                        className: 'input input-bordered'
                    }
                },

                // EMAIL + PASSWORD INPUT with confirm
                {
                    type: 'input',
                    props:
                    {
                        name: 'email',
                        type: 'email',
                        placeholder: 'Enter your email'
                    }
                },
                {
                    type: 'input',
                    props:
                    {
                        name: 'password',
                        type: 'password',
                        placeholder: 'Enter password',
                        withConfirm: true
                    }
                },

                // HIDDEN + FILE + NUMBER INPUT
                {
                    type: 'input',
                    props:
                    {
                        name: 'userId',
                        type: 'hidden',
                        value: '12345'
                    }
                },
                {
                    type: 'input',
                    props:
                    {
                        name: 'avatar',
                        type: 'file',
                        placeholder: 'Upload your avatar'
                    }
                },
                {
                    type: 'input',
                    props:
                    {
                        name: 'age',
                        type: 'number',
                        placeholder: 'Enter age',
                        min: 0,
                        max: 120,
                        step: 1
                    }
                },

                // SELECT INPUT
                {
                    type: 'input',
                    props:
                    {
                        name: 'country',
                        type: 'select',
                        placeholder: 'Choose your country',
                        options:
                        [
                            {
                                value: 'de',
                                label: 'Germany'
                            },
                            {
                                value: 'jp',
                                label: 'Japan'
                            },
                            {
                                value: 'us',
                                label: 'USA'
                            }
                        ]
                    }
                },

                // TOGGLE
                {
                    type: 'toggle',
                    props:
                    {
                        id: 'notify',
                        name: 'notify',
                        label: 'Receive Email Notifications',
                        checked: false
                    }
                },
                {
                    type: 'toggle',
                    props: {
                        id: 'readonlyToggle',
                        name: 'readonlyToggle',
                        label: 'This toggle is read-only',
                        checked: false,
                        readonly: true
                    }
                },

                // STAT BLOCK
                {
                    type: 'stat',
                    props:
                    {
                        label: 'Points Earned',
                        value: 999
                    }
                },
                {
                    type: 'stat',
                    props:
                    {
                        label: 'Tasks Completed',
                        value: '12/20',
                        className: 'text-green-300'
                    }
                },

                // TOOLBAR with JavaScript actions
                {
                    type: 'toolbar',
                    props:
                    {
                        buttons:
                        [
                            {
                                text: 'Greet',
                                onClick: "alert('Greetings! 🌟')"
                            },
                            {
                                text: 'Log User',
                                onClick: "console.log('User logged')"
                            }
                        ]
                    }
                },

                // MATCHUP (2 buttons as players)
                {
                    type: 'matchup',
                    props:
                    {
                        player1:
                        {
                            type: 'button',
                            props:
                            {
                                id: 'player-1',
                                text: 'Max',
                                className: 'btn btn-info',
                                type: 'button'
                            }
                        },
                        player2:
                        {
                            type: 'button',
                            props:
                            {
                                id: 'player-2',
                                text: 'Lena',
                                className: 'btn btn-green',
                                type: 'button'
                            }
                        }
                    }
                },

                // INPUTGROUP (compact multiple fields)
                {
                    type: 'inputgroup',
                    props:
                    {
                        inputs:
                        [
                            {
                                name: 'firstName',
                                placeholder: 'First Name'
                            },
                            {
                                name: 'lastName',
                                placeholder: 'Last Name'
                            },
                            {
                                name: 'nickname',
                                placeholder: 'Nickname',
                                type: 'text'
                            }
                        ]
                    }
                },

                // BUTTONGROUP (buttons + toggles inline)
                {
                    type: 'buttongroup',
                    props:
                    {
                        buttons:
                        [
                            {
                                text: 'Submit',
                                type: 'submit',
                            },
                            {
                                text: 'Clear',
                                type: 'button',
                            }
                        ],
                        toggles:
                        [
                            {
                                id: 'terms',
                                name: 'terms',
                                label: 'I agree to terms',
                                checked: false
                            },
                            {
                                id: 'updates',
                                name: 'updates',
                                label: 'Enable updates',
                                checked: true
                            }
                        ],
                        layout: 'stack',
                        align: 'left',
                        className: 'mb-2'
                    }
                },

                // BUTTON: Standalone
                {
                    type: 'button',
                    props:
                    {
                        id: 'downloadBtn',
                        text: 'Download PDF',
                        className: 'btn btn-outline',
                        color: 'red'
                    }
                },

                // BUTTON with icon and alignment
                {
                    type: 'button',
                    props:
                    {
                        text: '🔒 Secure Login',
                        color: 'yellow',
                        align: 'center'
                    }
                },

                // HTML Block (custom raw HTML)
                {
                    type: 'html',
                    props:
                    {
                        html: `
                            <div class="p-4 bg-neutral text-white rounded-lg">
                                <h4 class="text-xl font-semibold mb-2">Custom HTML Block</h4>
                                <p>This block supports any <strong>HTML</strong>, like <em>formatting</em>, <code>code</code>, and more.</p>
                                <a href="https://example.com" target="_blank" class="text-blue-300 underline">Learn more</a>
                            </div>
                        `
                    }
                },

                {
                    type: 'buttongroup',
                    props: {
                        buttons: [
                            {
                                id: 'btnDefault',
                                text: 'Default',
                                type: 'button'
                            },
                            {
                                id: 'btnGreen',
                                text: 'Success',
                                color: 'green'
                            },
                            {
                                id: 'btnRed',
                                text: 'Delete',
                                type: 'delete',
                                color: 'black'
                            },
                            {
                                id: 'btnSubmit',
                                text: 'Submit',
                                type: 'submit'
                            },
                            {
                                id: 'btnWithIcon',
                                icon: 'download',
                                text: 'Download',
                                color: 'blue'
                            },
                            {
                                id: 'btnOnlyIcon',
                                icon: 'fa-cog',
                                color: 'yellow'
                            },
                            {
                                id: 'btnWithJS',
                                text: 'Alert',
                                onClick: "alert('Button clicked!')",
                                color: 'yellow'
                            }
                        ],
                        layout: 'group',
                        align: 'left',
                        className: 'mt-4'
                    }
                }
            ]
        });

        return this.render(`${homeCard}`);
    }
}
