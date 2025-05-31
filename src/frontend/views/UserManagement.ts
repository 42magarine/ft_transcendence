import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import { UserList } from '../../interfaces/userInterfaces.js';
import Modal from '../components/Modal.js';
import UserService from '../services/UserService.js';

export default class UserManagement extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        let users: UserList[] = await UserService.getAllUsers();

        const createUserCard = await new Card().renderCard(
            {
                title: 'Create New User',
                formId: 'create-form',
                contentBlocks:
                    [
                        {
                            type: 'inputgroup',
                            props: {
                                inputs: [
                                    {
                                        name: 'displayname',
                                        label: 'Name',
                                        placeholder: 'Name'
                                    },
                                    {
                                        name: 'username',
                                        label: 'Username',
                                        placeholder: 'Username'
                                    },
                                    {
                                        name: 'email',
                                        type: 'email',
                                        label: 'E-Mail',
                                        placeholder: 'E-Mail'
                                    },
                                    {
                                        id: 'password',
                                        name: 'password',
                                        type: 'password',
                                        label: 'Password',
                                        placeholder: 'Password',
                                        withConfirm: true
                                    }
                                ]
                            }
                        },
                        {
                            type: 'buttongroup',
                            props: {
                                toggles: [
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
                                            className: 'btn btn-green'
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
                                columns: [
                                    { key: 'id', label: 'ID' },
                                    { key: 'displayname', label: 'Name' },
                                    { key: 'username', label: 'Username' },
                                    { key: 'email', label: 'Email' },
                                    { key: 'emailVerified', label: 'Verified' },
                                    { key: 'twoFAEnabled', label: '2FA' },
                                    { key: 'actions', label: 'Actions' }
                                ],
                                rowLayout: (user) => [
                                    {
                                        type: 'label',
                                        props: {
                                            text: `${user.id}`,
                                            htmlFor: `user-${user.id}-id`
                                        }
                                    },
                                    {
                                        type: 'label',
                                        props: {
                                            text: `${user.displayname}`,
                                            htmlFor: `user-${user.id}-name`
                                        }
                                    },
                                    {
                                        type: 'label',
                                        props: {
                                            text: `${user.username}`,
                                            htmlFor: `user-${user.id}-username`
                                        }
                                    },
                                    {
                                        type: 'label',
                                        props: {
                                            text: `${user.email}`,
                                            htmlFor: `user-${user.id}-email`
                                        }
                                    },
                                    {
                                        type: 'label',
                                        props: {
                                            text: `${user.emailVerified ? 'Yes' : 'No'}`,
                                            htmlFor: `user-${user.id}-verified`
                                        }
                                    },
                                    {
                                        type: 'label',
                                        props: {
                                            text: `${user.twoFAEnabled ? 'Enabled' : 'Disabled'}`,
                                            htmlFor: `user-${user.id}-2fa`
                                        }
                                    },
                                    {
                                        type: 'buttongroup',
                                        props: {
                                            buttons: [
                                                {
                                                    iconHtml: '<i class="fa-solid fa-eye"></i>',
                                                    href: `/users/${user.id}`,
                                                    className: 'btn btn-sm btn-primary',
                                                    align: 'center',
                                                },
                                                {
                                                    iconHtml: '<i class="fa-solid fa-pen-to-square"></i>',
                                                    href: `/users/edit/${user.id}`,
                                                    className: 'btn btn-sm btn-primary',
                                                    align: 'center',
                                                },
                                                {
                                                    iconHtml: '<i class="fa-solid fa-trash"></i>',
                                                    onClick: `handleDeleteUser(${user.id})`,
                                                    className: 'btn btn-sm btn-red delete-user',
                                                    align: 'center',
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
                            className: 'btn btn-red'
                        }
                    ],
                closableOnOutsideClick: true
            });
        return this.render(`${createUserCard}${deleteModal}`);
    }
}
