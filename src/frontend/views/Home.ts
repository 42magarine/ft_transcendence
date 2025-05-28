import UserService from '../services/UserService.js';
import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';

export default class Home extends AbstractView
{
    constructor()
    {
        super();
    }

    async getHtml(): Promise<string>
    {
        const currentUser = await UserService.getCurrentUser();

        // Card to demonstrate all available content block types
        const testCard = await new Card().renderCard(
        {
            title:  currentUser
                ? `Hello ${currentUser.displayname}, this is Transcendence!`
                : 'Welcome to',
            formId: 'test-form',
            contentBlocks:
            [
                {
                    type: 'label',
                    props:
                    {
                        htmlFor: 'testInput',
                        text: 'This is a test label'
                    }
                },
                {
                    type: 'input',
                    props:
                    {
                        name: 'testInput',
                        type: 'text',
                        placeholder: 'Type something...'
                    }
                },
                {
                    type: 'toggle',
                    props:
                    {
                        id: 'testToggle',
                        name: 'testToggle',
                        label: 'Enable feature',
                        checked: false
                    }
                },
                {
                    type: 'stat',
                    props:
                    {
                        label: 'Current Score',
                        value: '42'
                    }
                },
                {
                    type: 'toolbar',
                    props:
                    {
                        buttons:
                        [
                            {
                                text: 'Say Hello',
                                onClick: "alert('Hello!')"
                            },
                            {
                                text: 'Say Bye',
                                onClick: "alert('Bye!')"
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
                                id: 'player1-btn',
                                text: 'Alice',
                                type: 'button',
                                className: 'btn btn-success'
                            }
                        },
                        player2: {
                            type: 'button',
                            props: {
                                id: 'player2-btn',
                                text: 'Bob',
                                type: 'button',
                                className: 'btn btn-warning'
                            }
                        }
                    }
                },
                {
                    type: 'actions',
                    props:
                    {
                        buttons: `<button class="btn btn-accent" onclick="alert('Action clicked!')">Click Me</button>`
                    }
                },
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
                            }
                        ]
                    }
                },
                {
                    type: 'buttongroup',
                    props:
                    {
                        buttons:
                        [
                            {
                                text: 'Save',
                                type: 'submit',
                                className: 'btn btn-primary'
                            },
                            {
                                text: 'Cancel',
                                type: 'button',
                                className: 'btn btn-secondary'
                            }
                        ],
                        toggles:
                        [
                            {
                                id: 'acceptTerms',
                                name: 'acceptTerms',
                                label: 'Accept Terms',
                                checked: false }
                        ],
                        layout: 'stack',
                        align: 'left'
                    }
                },
                {
                    type: 'button',
                    props:
                    {
                        text: 'Standalone Button',
                        type: 'button',
                        className: 'btn btn-info'
                    }
                },
                {
                    type: 'html',
                    props:
                    {
                        html: `<p class="text-white">This is a raw HTML block inside the card.</p>`
                    }
                }
            ]
        });
        return this.render(`${testCard}`);
    }
}
