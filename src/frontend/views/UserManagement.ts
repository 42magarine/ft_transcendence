import Title from '../components/Title.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import AbstractView from '../../utils/AbstractView.js';
import { UserList } from '../../interfaces/userInterfaces.js';
import Toggle from '../components/Toggle.js';
import Modal from '../components/Modal.js';
import Input from '../components/Input.js';

export default class UserManagement extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        let users = [];
        try {
            const response = await fetch('/api/users/');
            if (response.ok) {
                users = await response.json();
            } else {
                console.error('Failed to fetch users from API');
            }
        } catch (error) {
            console.error('API request error:', error);
        }

        users.forEach((user: UserList) => {
            user.listAvatar = generateProfileImage(user, 20, 20);
        });

        const button = new Button();
        const readAllButtonGroup = await button.renderGroup({
            layout: 'stack',
            align: 'center',
            buttons: [
                {
                    id: 'read-all',
                    text: 'Read all Users',
                    onClick: `document.getElementById('user-list').innerHTML = '<li>Loading...</li>'`
                }
            ]
        });

        const toggle = new Toggle();
        const emailVerifiedToggle = await toggle.renderToggle({
            id: 'emailVerified',
            name: 'emailVerified',
            label: 'Email Verified:',
            checked: false
        });
        const twoFAToggle = await toggle.renderToggle({
            id: 'twoFAEnabled',
            name: 'twoFAEnabled',
            label: '2FA Enabled:',
            checked: false,
            readonly: true
        });
        const googleSignInToggle = await toggle.renderToggle({
            id: 'googleSignIn',
            name: 'googleSignIn',
            label: 'Google Sign-In:',
            checked: false,
            readonly: true
        });

        const card = new Card();

        const listCard = await new Card().renderCard({
            title: 'Users',
            table: {
                id: 'user-list',
                height: '400px',
                data: users,
                columns: [
                    { key: 'id', label: 'ID' },
                    { key: 'displayname', label: 'Name' },
                    { key: 'username', label: 'Username' },
                    { key: 'email', label: 'E-Mail' },
                    { key: 'emailVerified', label: 'E-Mail Verified' },
                    { key: 'twoFAEnabled', label: '2FA' },
                    {
                        key: 'actions',
                        label: '',
                        isAction: true,
                        buttons: (user) => [
                            {
                                id: `view-${user.id}`,
                                href: `/users/${user.id}`,
                                iconHtml: '<i class="fa-solid fa-eye"></i>'
                            },
                            {
                                id: `edit-${user.id}`,
                                href: `/users/edit/${user.id}`,
                                iconHtml: '<i class="fa-solid fa-pen-to-square"></i>'
                            },
                            {
                                id: `delete-${user.id}`,
                                className: 'btn btn-danger delete-user',
                                type: 'button',
                                onClick: `handleDeleteUser(${user.id})`,
                                status: 'unavailable',
                                iconHtml: '<i class="fa-solid fa-trash"></i>'
                            }
                        ]
                    }
                ]
            }
        });
        
        

        const input = new Input();

        const formBody = `
            ${await input.renderInput({
                name: 'Displayname',
            })}
            ${await input.renderInput({
                name: 'Username',
            })}
            ${await input.renderInput({
                name: 'Email-adress',
                type: 'email',
            })}

            ${emailVerifiedToggle}
            ${twoFAToggle}
            ${googleSignInToggle}

            ${await input.renderInput({
                id: 'create-password',
                name: 'Password',
                type: 'password',
                withConfirm: true
            })}

           ${await button.renderButton({
                id: 'create-user-btn',
                text: 'Create User',
                type: 'submit',
                className: 'btn btn-success',
            })}
        `;
        
    
        
        const createCard = await card.renderCard({
            title: 'Create New User',
            body: `<form id="create-form">${formBody}</form>`
        });

        const deleteModal = await new Modal().renderModal({
            id: 'confirm-delete-modal',
            title: 'Confirm Deletion',
            content: `
                <p>Are you sure you want to delete this user?<br>
                <strong>This action cannot be undone.</strong></p>
            `,
            footerButtons: [
                {
                    id: 'cancel-delete-btn',
                    text: 'Cancel',
                    className: 'btn btn-secondary',
                    onClick: `document.getElementById('confirm-delete-modal').classList.add('hidden')`
                },
                {
                    id: 'confirm-delete-btn',
                    text: 'Yes, Delete',
                    className: 'btn btn-danger',
                    //onClick: document.getElementById('confirm-delete-modal').classList.add('hidden')
                }                
            ],
            animation: 'scale',
            closableOnOutsideClick: true
        });

        return this.render(`
            <div class="container">
                ${createCard}
                ${listCard}
                ${deleteModal}
            </div>
        `);
    }
}
