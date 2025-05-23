import Title from '../components/Title.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import AbstractView from '../../utils/AbstractView.js';
import { UserList } from '../../interfaces/userInterfaces.js';

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
            } else {
                console.error('Failed to fetch users from API');
            }
        } catch (error) {
            console.error('API request error:', error);
        }

        // Correctly loop through each user and add avatar
        users.forEach((user: UserList) => {
            user.listAvatar = generateProfileImage(user, 20, 20);
        });

        // Title section
        const title = new Title({
            title: 'User Management',
        });
        const titleSection = await title.getHtml();

        // Button Group (uses  automatically)
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

        // CRUD Form Cards
        const card = new Card();

        const cardConfigs = [
            // {
            // 	title: 'Read One User',
            // 	formId: 'read-one-form',
            // 	inputs: [{ name: 'userId', type: 'number', placeholder: 'User ID' }],
            // 	button: { text: 'Read User', type: 'submit' },
            // 	extra: `<div id="read-result" class="text-white text-sm pt-2"></div>`
            // },
            // {
            // 	title: 'Update User',
            // 	formId: 'update-form',
            // 	inputs: [
            // 		{ name: 'id', type: 'number', placeholder: 'User ID' },
            // 		{ name: 'name', placeholder: 'New Name' },
            // 		{ name: 'username', placeholder: 'New Username' }
            // 	],
            // 	button: { text: 'Update', type: 'submit' }
            // },
            // {
            // 	title: 'Delete User',
            // 	formId: 'delete-form',
            // 	inputs: [{ name: 'id', type: 'number', placeholder: 'User ID' }],
            // 	button: { text: 'Delete', type: 'submit', className: 'btn btn-danger btn-sm' },
            // }
        ];

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
					<th>Role</th>
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
						<td><span class="role-tag role-{{user.role}}">{{user.role}}</span></td>
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
                { name: 'displayname', type: "text", placeholder: 'Name' },
                { name: 'username', type: "text", placeholder: 'Username' },
                { name: 'email', type: 'email', placeholder: 'Email Address' },
                {
                    name: 'role',
                    type: 'select',
                    placeholder: 'Select Role',
                    options: [
                        {
                            label: "User",
                            value: "user"
                        },
                        {
                            label: "Admin",
                            value: "admin"
                        }
                    ]
                },
                { name: 'password', type: 'password', placeholder: 'Password' }
            ],
            button: { text: 'Create', type: 'submit', className: "btn btn-primary" }
        });

        // Final output - Pass users data to the render method
        return this.render(`
			<div class="container">
				${titleSection}
				${registerCard}
				${listCard}
			</div>
		`);
    }
}
