import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import { UserList } from '../../interfaces/userInterfaces.js';
import Modal from '../components/Modal.js';
import UserService from '../services/UserService.js';

export default class UserManagement extends AbstractView
{
    constructor()
    {
        super();
    }

    async getHtml(): Promise<string>
    {
        let users: UserList[] = await UserService.getAllUsers();

        const createUserCard = await new Card().renderCard(
        {
            title: 'Create New User',
            formId: 'create-form',
            contentBlocks:
            [
                {
                    type: 'buttongroup',
                    props:
                    {
                        inputs:
                        [
                            {
                                name: 'displayname',
                                placeholder: 'Name'
                            },
                            {
                                name: 'email',
                                type: 'email',
                                placeholder: 'E-Mail'
                            },
                            {
                                name: 'password',
                                type: 'password',
                                placeholder: 'Password',
                                withConfirm: true
                            }
                        ],
                        toggles:
                        [
                            {
                                id: 'emailVerified',
                                name: 'emailVerified',
                                label: 'Email Verified:',
                                checked: false
                            },
                            {
                                id: 'twoFAEnabled',
                                name: 'twoFAEnabled',
                                label: '2FA Enabled:',
                                checked: false,
                                readonly: true
                            },
                            {
                                id: 'googleSignIn',
                                name: 'googleSignIn',
                                label: 'Google Sign-In:',
                                checked: false,
                                readonly: true
                            }
                        ],
                        layout: 'stack',
                        align: 'left'
                    }
                },
                {
                    type: 'buttongroup',
                    props:
                    {
                        buttons:
                        [
                            {
                                text: 'Create User',
                                type: 'submit',
                                className: 'btn btn-success'
                            }
                        ],
                        layout: 'stack',
                        align: 'left'
                    }
                },
                // Safe label
                {
                    type: 'label',
                    props: {
                        htmlFor: 'dummy-id',
                        text: ' '
                    }
                },

                // Safe table
                {
                    type: 'table',
                    props: {
                        id: 'user-list',
                        title: 'User Overview',
                        height: '300px',
                        data: users,
                        rowLayout: (user) => [
                            {
                                type: 'label',
                                props: {
                                    text: `ID: ${user.id}`,
                                    htmlFor: `user-${user.id}-id`
                                }
                            },
                            {
                                type: 'label',
                                props: {
                                    text: `Name: ${user.displayname}`,
                                    htmlFor: `user-${user.id}-name`
                                }
                            },
                            {
                                type: 'label',
                                props: {
                                    text: `Username: ${user.username}`,
                                    htmlFor: `user-${user.id}-username`
                                }
                            },
                            {
                                type: 'label',
                                props: {
                                    text: `Email: ${user.email}`,
                                    htmlFor: `user-${user.id}-email`
                                }
                            },
                            {
                                type: 'label',
                                props: {
                                    text: `Verified: ${user.emailVerified ? 'Yes' : 'No'}`,
                                    htmlFor: `user-${user.id}-verified`
                                }
                            },
                            {
                                type: 'label',
                                props: {
                                    text: `2FA: ${user.twoFAEnabled ? 'Enabled' : 'Disabled'}`,
                                    htmlFor: `user-${user.id}-2fa`
                                }
                            },
                            {
                                type: 'buttongroup',
                                props: {
                                    buttons: [
                                        {
                                            text: '',
                                            html: `<a href="/users/${user.id}" class="btn btn-sm btn-ghost"><i class="fa-solid fa-eye"></i></a>`
                                        },
                                        {
                                            text: '',
                                            html: `<a href="/users/edit/${user.id}" class="btn btn-sm btn-ghost"><i class="fa-solid fa-pen-to-square"></i></a>`
                                        },
                                        {
                                            text: '',
                                            html: `<button class="btn btn-sm btn-danger delete-user" onclick="handleDeleteUser(${user.id})">
                                                        <i class="fa-solid fa-trash"></i>
                                                </button>`
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
                
            ]
        });

        const deleteModal = await new Modal().renderModal(
        {
            id: 'confirm-delete-modal',
            title: 'Confirm Deletion',
            content: `
                <p>Are you sure you want to delete this user?<br>
                <strong>This action cannot be undone.</strong></p>
            `,
            footerButtons:
            [
                {
                    id: 'cancel-delete-btn',
                    text: 'Cancel',
                    className: 'btn btn-secondary',
                    onClick: `document.getElementById('confirm-delete-modal').classList.add('hidden')`
                },
                {
                    id: 'confirm-delete-btn',
                    text: 'Yes, Delete',
                    className: 'btn btn-danger'
                }
            ],
            animation: 'scale',
            closableOnOutsideClick: true
        });
        return this.render(`${createUserCard}${deleteModal}`);
    }
}
