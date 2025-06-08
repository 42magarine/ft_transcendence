import UserService from '../services/UserService.js';
import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import __ from '../services/LanguageService.js';

export default class Home extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const currentUser = await UserService.getCurrentUser();
        const homeCard = await new Card().renderCard({
            title: currentUser
                ? `Hello ${currentUser.name}, ${__('this is Transcendence, please don\'t delete this card, it is for testing purpose!')}`
                : __('Welcome to Transcendence!'),
            formId: 'test-form',
            contentBlocks: [
                {
                    type: 'button',
                    props: {
                        text: __('Max'),
                        type: 'button',
                        color: 'red'
                    }
                },
                {
                    type: 'label',
                    props: {
                        htmlFor: 'fullName',
                        text: __('Full Name')
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'fullName',
                        type: 'text',
                        placeholder: __('Enter your name'),
                        className: 'input input-bordered'
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'email',
                        type: 'email',
                        placeholder: __('Enter your email')
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'password',
                        type: 'password',
                        placeholder: __('Enter password'),
                        withConfirm: true
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'userId',
                        type: 'hidden',
                        value: '12345'
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'avatar',
                        type: 'file',
                        placeholder: __('Upload your avatar')
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'age',
                        type: 'number',
                        placeholder: __('Enter age'),
                        min: 0,
                        max: 120,
                        step: 1
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'country',
                        type: 'select',
                        placeholder: __('Choose your country'),
                        options: [
                            { value: 'de', label: __('Germany') },
                            { value: 'jp', label: __('Japan') },
                            { value: 'us', label: __('USA') }
                        ]
                    }
                },
                {
                    type: 'toggle',
                    props: {
                        id: 'notify',
                        name: 'notify',
                        label: __('Receive Email Notifications'),
                        checked: false
                    }
                },
                {
                    type: 'toggle',
                    props: {
                        id: 'readonlyToggle',
                        name: 'readonlyToggle',
                        label: __('This toggle is read-only'),
                        checked: false,
                        readonly: true
                    }
                },
                {
                    type: 'stat',
                    props: {
                        label: __('Points Earned'),
                        value: 999
                    }
                },
                {
                    type: 'stat',
                    props: {
                        label: __('Tasks Completed'),
                        value: '12/20',
                        className: 'text-green-300'
                    }
                },
                {
                    type: 'toolbar',
                    props: {
                        buttons: [
                            {
                                text: __('Greet'),
                                onClick: "alert('Greetings! 🌟')"
                            },
                            {
                                text: __('Log User'),
                                onClick: "console.log('User logged')"
                            }
                        ]
                    }
                },
                {
                    type: 'matchup',
                    props: {
                        player1: {
                            type: 'button',
                            props: {
                                id: 'player-1',
                                text: __('Max'),
                                className: 'btn btn-info',
                                type: 'button'
                            }
                        },
                        player2: {
                            type: 'button',
                            props: {
                                id: 'player-2',
                                text: __('Lena'),
                                className: 'btn btn-green',
                                type: 'button'
                            }
                        }
                    }
                },
                {
                    type: 'inputgroup',
                    props: {
                        inputs: [
                            { name: 'firstName', placeholder: __('First Name') },
                            { name: 'lastName', placeholder: __('Last Name') },
                            { name: 'nickname', placeholder: __('Nickname'), type: 'text' }
                        ]
                    }
                },
                {
                    type: 'buttongroup',
                    props: {
                        buttons: [
                            { text: __('Submit'), type: 'submit' },
                            { text: __('Clear'), type: 'button' }
                        ],
                        toggles: [
                            { id: 'terms', name: 'terms', label: __('I agree to terms'), checked: false },
                            { id: 'updates', name: 'updates', label: __('Enable updates'), checked: true }
                        ],
                        layout: 'stack',
                        align: 'left',
                        className: 'mb-2'
                    }
                },
                {
                    type: 'button',
                    props: {
                        id: 'downloadBtn',
                        text: __('Download PDF'),
                        className: 'btn btn-outline',
                        color: 'red'
                    }
                },
                {
                    type: 'button',
                    props: {
                        text: __('🔒 Secure Login'),
                        color: 'yellow',
                        align: 'center'
                    }
                },
                {
                    type: 'html',
                    props: {
                        html: `
                            <div class="p-4 bg-neutral text-white rounded-lg">
                                <h4 class="text-xl font-semibold mb-2">${__('Custom HTML Block')}</h4>
                                <p>${__('This block supports any')} <strong>HTML</strong>, ${__('like')} <em>${__('formatting')}</em>, <code>code</code>, ${__('and more')}.</p>
                                <a href="https://example.com" target="_blank" class="text-blue-300 underline">${__('Learn more')}</a>
                            </div>
                        `
                    }
                },
                {
                    type: 'buttongroup',
                    props: {
                        buttons: [
                            { id: 'btnDefault', text: __('Default'), type: 'button' },
                            { id: 'btnGreen', text: __('Success'), color: 'green' },
                            { id: 'btnRed', text: __('Delete'), type: 'delete', color: 'black' },
                            { id: 'btnSubmit', text: __('Submit'), type: 'submit' },
                            { id: 'btnWithIcon', icon: 'download', text: __('Download'), color: 'blue' },
                            { id: 'btnOnlyIcon', icon: 'fa-cog', color: 'yellow' },
                            { id: 'btnWithJS', text: __('Alert'), onClick: "alert('Button clicked!')", color: 'yellow' }
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
