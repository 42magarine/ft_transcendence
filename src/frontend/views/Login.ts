import Card from '../components/Card.js';
import AbstractView from '../../utils/AbstractView.js';
import __ from '../services/LanguageService.js';

export default class Login extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const loginCard = await new Card().renderCard(
            {
                title: window.ls.__('Login'),
                formId: 'login-form',
                contentBlocks:
                    [
                        {
                            type: 'inputgroup',
                            props:
                            {
                                inputs:
                                    [
                                        {
                                            name: 'email',
                                            type: 'text',
                                            placeholder: window.ls.__('E-Mail')
                                        },
                                        {
                                            name: 'password',
                                            type: 'password',
                                            placeholder: window.ls.__('Password')
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
                                            text: window.ls.__('Login'),
                                            type: 'submit',
                                            className: 'btn btn-primary',
                                        },
                                        {
                                            id: 'signup-redirect',
                                            type: 'text-with-button',
                                            text: window.ls.__('sign up'),
                                            textBefore: window.ls.__('May want to'),
                                            href: '/signup',
                                            className: 'underline',
                                            align: 'center',
                                        },
                                        {
                                            id: 'reset-password',
                                            type: 'text-with-button',
                                            text: window.ls.__('Reset Password'),
                                            textBefore: window.ls.__('Did you forget your Password?'),
                                            href: '/password-reset',
                                            className: 'underline',
                                            align: 'center',
                                        },
                                        {
                                            id: 'google-signin',
                                            type: 'google-signin',
                                            align: 'center',
                                        }
                                    ],
                                layout: 'stack',
                                align: 'center'
                            }
                        }
                    ]
            });
        return this.render(`${loginCard}`);
    }
}
