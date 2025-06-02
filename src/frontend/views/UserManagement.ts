// File: frontend/views/UserManagement.ts
import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import { UserList } from '../../interfaces/userInterfaces.js';
import UserService from '../services/UserService.js';

export default class UserManagement extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const users: UserList[] = await UserService.getAllUsers();

        const createUserCard = await new Card().renderCard({
            title: 'Create New User',
            formId: 'create-form',
            contentBlocks: [
                {
                    type: 'inputgroup',
                    props: {
                        inputs: [
                            {
                                name: 'displayname',
                                label: 'Name',
                                placeholder: 'Name',
                            },
                            {
                                name: 'username',
                                label: 'Username',
                                placeholder: 'Username',
                            },
                            {
                                name: 'email',
                                type: 'email',
                                label: 'E-Mail',
                                placeholder: 'E-Mail',
                            },
                            {
                                id: 'password',
                                name: 'password',
                                type: 'password',
                                label: 'Password',
                                placeholder: 'Password',
                                withConfirm: true,
                            },
                        ],
                    },
                },
                {
                    type: 'buttongroup',
                    props: {
                        toggles: [
                            {
                                id: 'emailVerified',
                                name: 'emailVerified',
                                label: 'Email Verified:',
                                checked: false,
                            },
                            {
                                id: 'twoFAEnabled',
                                name: 'twoFAEnabled',
                                label: '2FA Enabled:',
                                checked: false,
                            },
                            {
                                id: 'googleSignIn',
                                name: 'googleSignIn',
                                label: 'Google Sign-In:',
                                checked: false,
                                readonly: true,
                            },
                        ],
                        layout: 'stack',
                        align: 'left',
                    },
                },
                {
                    type: 'buttongroup',
                    props: {
                        buttons: [
                            {
                                text: 'Create User',
                                icon: 'user-plus',
                                type: 'submit',
                                color: 'green',
                                className: 'w-full',
                            },
                        ],
                        layout: 'stack',
                        align: 'left',
                    },
                },
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
                            { key: 'actions', label: 'Actions' },
                        ],
                        rowLayout: (user) => [
                            {
                                type: 'label',
                                props: {
                                    text: `${user.id}`,
                                    htmlFor: `user-${user.id}-id`,
                                },
                            },
                            {
                                type: 'label',
                                props: {
                                    text: `${user.displayname}`,
                                    htmlFor: `user-${user.id}-name`,
                                },
                            },
                            {
                                type: 'label',
                                props: {
                                    text: `${user.username}`,
                                    htmlFor: `user-${user.id}-username`,
                                },
                            },
                            {
                                type: 'label',
                                props: {
                                    text: `${user.email}`,
                                    htmlFor: `user-${user.id}-email`,
                                },
                            },
                            {
                                type: 'label',
                                props: {
                                    htmlFor: `user-${user.id}-verified`,
                                    iconHtml: user.emailVerified ? 'fa-check' : 'fa-times',
                                    color: user.emailVerified ? 'green' : 'red',
                                    className: 'text-sm',
                                },
                            },
                            {
                                type: 'label',
                                props: {
                                    text: user.twoFAEnabled ? 'Enabled' : 'Disabled',
                                    htmlFor: `user-${user.id}-2fa`,
                                },
                            },
                            {
                                type: 'buttongroup',
                                props: {
                                    buttons: [
                                        {
                                            icon: 'eye',
                                            text: 'View',
                                            href: `/users/${user.id}`,
                                        },
                                        {
                                            icon: 'pen-to-square',
                                            text: 'Edit',
                                            href: `/users/edit/${user.id}`,
                                        },
                                        {
                                            id: `delete-user-${user.id}`,
                                            icon: 'trash',
                                            text: 'Delete',
                                            color: 'red',
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            ],
        });

        return this.render(`${createUserCard}`);
    }
}
