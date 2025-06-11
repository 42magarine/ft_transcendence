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
                ? `Hello ${currentUser.name}, ${window.ls.__('this is Transcendence, please don\'t delete this card, it is for testing purpose!')}`
                : window.ls.__('Welcome to Transcendence!'),
            formId: 'test-form',
            contentBlocks: [
                {
                    type: 'button',
                    props: {
                        text: window.ls.__('Max'),
                        type: 'button',
                        color: 'red'
                    }
                },
                {
                    type: 'label',
                    props: {
                        htmlFor: 'fullName',
                        text: window.ls.__('Full Name')
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'fullName',
                        type: 'text',
                        placeholder: window.ls.__('Enter your name'),
                        className: 'input input-bordered'
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'email',
                        type: 'email',
                        placeholder: window.ls.__('Enter your email')
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'password',
                        type: 'password',
                        placeholder: window.ls.__('Enter password'),
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
                        placeholder: window.ls.__('Upload your avatar')
                    }
                },
                {
                    type: 'input',
                    props: {
                        name: 'age',
                        type: 'number',
                        placeholder: window.ls.__('Enter age'),
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
                        placeholder: window.ls.__('Choose your country'),
                        options: [
                            { value: 'de', label: window.ls.__('Germany') },
                            { value: 'jp', label: window.ls.__('Japan') },
                            { value: 'us', label: window.ls.__('USA') }
                        ]
                    }
                },
                {
                    type: 'toggle',
                    props: {
                        id: 'notify',
                        name: 'notify',
                        label: window.ls.__('Receive Email Notifications'),
                        checked: false
                    }
                },
                {
                    type: 'toggle',
                    props: {
                        id: 'readonlyToggle',
                        name: 'readonlyToggle',
                        label: window.ls.__('This toggle is read-only'),
                        checked: false,
                        readonly: true
                    }
                },
                {
                    type: 'stat',
                    props: {
                        label: window.ls.__('Points Earned'),
                        value: 999
                    }
                },
                {
                    type: 'stat',
                    props: {
                        label: window.ls.__('Tasks Completed'),
                        value: '12/20',
                        className: 'text-green-300'
                    }
                },
                {
                    type: 'toolbar',
                    props: {
                        buttons: [
                            {
                                text: window.ls.__('Greet'),
                                onClick: "alert('Greetings! 🌟')"
                            },
                            {
                                text: window.ls.__('Log User'),
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
                                text: window.ls.__('Max'),
                                className: 'btn btn-info',
                                type: 'button'
                            }
                        },
                        player2: {
                            type: 'button',
                            props: {
                                id: 'player-2',
                                text: window.ls.__('Lena'),
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
                            { name: 'firstName', placeholder: window.ls.__('First Name') },
                            { name: 'lastName', placeholder: window.ls.__('Last Name') },
                            { name: 'nickname', placeholder: window.ls.__('Nickname'), type: 'text' }
                        ]
                    }
                },
                {
                    type: 'buttongroup',
                    props: {
                        buttons: [
                            { text: window.ls.__('Submit'), type: 'submit' },
                            { text: window.ls.__('Clear'), type: 'button' }
                        ],
                        toggles: [
                            { id: 'terms', name: 'terms', label: window.ls.__('I agree to terms'), checked: false },
                            { id: 'updates', name: 'updates', label: window.ls.__('Enable updates'), checked: true }
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
                        text: window.ls.__('Download PDF'),
                        className: 'btn btn-outline',
                        color: 'red'
                    }
                },
                {
                    type: 'button',
                    props: {
                        text: window.ls.__('🔒 Secure Login'),
                        color: 'yellow',
                        align: 'center'
                    }
                },
                {
                    type: 'buttongroup',
                    props: {
                        buttons: [
                            { id: 'btnDefault', text: window.ls.__('Default'), type: 'button' },
                            { id: 'btnGreen', text: window.ls.__('Success'), color: 'green' },
                            { id: 'btnRed', text: window.ls.__('Delete'), type: 'delete', color: 'black' },
                            { id: 'btnSubmit', text: window.ls.__('Submit'), type: 'submit' },
                            { id: 'btnWithIcon', icon: 'download', text: window.ls.__('Download'), color: 'blue' },
                            { id: 'btnOnlyIcon', icon: 'fa-cog', color: 'yellow' },
                            { id: 'btnWithJS', text: window.ls.__('Alert'), onClick: "alert('Button clicked!')", color: 'yellow' }
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
