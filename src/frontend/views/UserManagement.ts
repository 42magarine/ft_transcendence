import AbstractView from '../../utils/AbstractView.js';
import Button from '../components/Button.js';
import Card from '../components/Card.js';
import Title from '../components/Title.js';
import { UserList } from '../../interfaces/userInterfaces.js';
import Modal from '../components/Modal.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import UserService from '../services/UserService.js';

export default class UserManagement extends AbstractView
{
	constructor()
	{
		super();
	}

	async getHtml(): Promise<string>
	{
		const button = new Button();
		let users: UserList[] = await UserService.getAllUsers();

		const card = new Card();

		const listCard = await new Card().renderCard(
		{
			title: 'Users',
			table:
			{
				id: 'user-list',
				height: '400px',
				data: users,
				columns:
				[
					{
                        key: 'id',
                        label: 'ID'
                    },
					{
                        key: 'displayname',
                        label: 'Name'
                    },
					{
                        key: 'username',
                        label: 'Username'
                    },
					{
                        key: 'email',
                        label: 'E-Mail'
                    },
					{
                        key: 'emailVerified',
                        label: 'E-Mail Verified'
                    },
					{
                        key: 'twoFAEnabled',
                        label: '2FA'
                    },
					{
						key: 'actions',
						label: '',
						isAction: true,
						buttons: (user) =>
						[
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

		const createCard = await card.renderCard(
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
					// You may implement real logic later
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
