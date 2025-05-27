import Title from '../components/Title.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import AbstractView from '../../utils/AbstractView.js';
import { UserList } from '../../interfaces/userInterfaces.js';
import Toggle from '../components/Toggle.js';
import Modal from '../components/Modal.js';
import UserService from '../services/UserService.js';
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

        const title = new Title({ title: 'User Management' });
        const titleSection = await title.getHtml();

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
        const listCard = await card.renderCard({
            title: 'Users',
            extra: `<table class="list" data-height="400px">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Username</th>
                        <th>E-Mail</th>
                        <th>E-Mail Verified</th>
                        <th>2FA</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <for each="users" as="user">
                        <tr>
                            <td>{{user.id}}</td>
                            <td>{{user.displayname}}</td>
                            <td>{{user.username}}</td>
                            <td>{{user.email}}</td>
                            <td>{{user.emailVerified}}</td>
                            <td>{{user.twoFAEnabled}}</td>
                            <td class="text-right">
                                <a router class="btn" href="/users/{{user.id}}"><i class="fa-solid fa-eye"></i></a>
                                <a router class="btn" href="/users/edit/{{user.id}}"><i class="fa-solid fa-pen-to-square"></i></a>
                                <button type="button" class="btn btn-danger delete-user" data-user="{{user.id}}"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        </tr>
                    </for>
                </tbody>
            </table>`,
            data: { users }
        });

        const input = new Input();

        const formBody = `
        <div class="profile-header"></div>
        <div class="profile-details space-y-4">
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
        </div>

            <div class="text-center mt-6">
                <button type="submit" class="btn btn-success">Create User</button>
            </div>
        `;
        
    
        
        const createCard = await card.renderCard({
            title: 'Create New User',
            body: `<form id="create-form">${formBody}</form>`
        });

        const deleteModal = await new Modal().renderModal({
            id: 'confirm-delete-modal',
            title: 'Confirm Deletion',
            content: `<p>Are you sure you want to delete this user?<br><strong>This action cannot be undone.</strong></p>`,
            footer: `
                <div class="flex justify-end gap-4">
                    <button class="btn btn-secondary" onclick="document.getElementById('confirm-delete-modal').classList.add('hidden')">Cancel</button>
                    <button id="confirm-delete-btn" class="btn btn-danger">Yes, Delete</button>
                </div>
            `,
            animation: 'scale',
            closableOnOutsideClick: true
        });

        return this.render(`
            <div class="container">
                ${titleSection}
                ${createCard}
                ${listCard}
                ${deleteModal}
            </div>
        `);
    }
}
