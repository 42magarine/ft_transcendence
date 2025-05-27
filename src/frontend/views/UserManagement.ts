import AbstractView from '../../utils/AbstractView.js';
import Button from '../components/Button.js';
import Card from '../components/Card.js';
import Title from '../components/Title.js';
import { UserList } from '../../interfaces/userInterfaces.js';
import { generateProfileImage } from '../../utils/Avatar.js';

export default class UserManagement extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        // Fetch users from API
        let users = [];
        try {
            const response = await fetch('/api/users/');
            if (response.ok) {
                users = await response.json();
            }
            else {
                console.error('Failed to fetch users from API');
            }
        }
        catch (error) {
            console.error('API request error:', error);
        }

        // Add avatar to each user
        users.forEach((user: UserList) => {
            user.listAvatar = generateProfileImage(user, 20, 20);
        });

        // Title
        const title = new Title({ title: 'User Management' });
        const titleSection = await title.getHtml();

        // Optional Button Group
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

        const card = new Card();

        // List Card
        const listCard = await card.renderCard({
            title: 'Users',
            extra: `<table class="list" data-height="400px">
                <thead>
                    <tr>
                        <th>Avatar</th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Username</th>
                        <th>E-Mail</th>
                        <th>Verified</th>
                        <th>2FA</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <for each="users" as="user">
                        <tr>
                            <td>{{user.listAvatar}}</td>
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

        // Register Card
        const registerCard = await card.renderCard({
            title: 'Create User',
            formId: 'create-form',
            inputs: [
                { name: 'displayname', type: 'text', placeholder: 'Name' },
                { name: 'username', type: 'text', placeholder: 'Username' },
                { name: 'email', type: 'email', placeholder: 'Email Address' },
                {
                    name: 'emailVerified',
                    type: 'select',
                    placeholder: 'Mark Email Verified',
                    value: 'false',
                    options: [
                        { label: 'Yes', value: 'true' },
                        { label: 'No', value: 'false' }
                    ]
                },
                // Hidden value submitted to backend
                { name: 'twoFAEnabled', type: 'hidden', value: 'false' },
                // Display-only label row
                {
                    name: 'twoFAInfo',
                    type: 'display',
                    placeholder: '2FA',
                    value: '2FA Default Off'
                },
                { name: 'password', type: 'password', placeholder: 'Password' }
            ],
            button: {
                text: 'Create',
                type: 'submit',
                className: 'btn btn-primary'
            }
        });

        // Final layout
        return this.render(`
            <div class="container">
                ${titleSection}
                ${registerCard}
                ${listCard}
            </div>
        `);
    }
}
