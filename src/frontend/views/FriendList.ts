import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import { FriendList } from '../../interfaces/userInterfaces.js';
import UserService from '../services/UserService.js';
import Modal from '../components/Modal.js'

export default class Friends extends AbstractView {
	constructor() {
		super();
	}

	async getHtml(): Promise<string> {
		const friends: FriendList[] = await UserService.getFriends?.() ?? [];

		const friendsCard = await new Card().renderCard({
			title: 'Friends',
			formId: 'friend-form',
			contentBlocks: [
				{
					type: 'inputgroup',
					props: {
						inputs: [
							{
								id: 'friend-username',
								name: 'username',
								label: 'Username',
								placeholder: 'Search for a friend...'
							}
						]
					}
				},
				{
                    type: 'buttongroup',
                    props: {
                        buttons: [
                            {
                                id: 'add-friend-btn',
                                text: 'Add as Friend',
                                type: 'button',
                                icon: 'user-plus',
                                color: 'green'
                            }
                        ],
                        layout: 'stack',
                        align: 'left'
                    }
                },                
				{
					type: 'label',
					props: {
						htmlFor: 'dummy-id',
						text: ' '
					}
				},
                {
                    type: 'label',
                    props: {
                        htmlFor: 'friend-feedback',
                        id: 'friend-feedback',
                        text: '',
                        className: 'text-sm text-red-500 hidden'
                    }
                },                
				{
					type: 'table',
					props: {
						id: 'friends-list',
						title: 'Your Friends',
						height: '300px',
						data: friends,
						columns: [
							{ key: 'id', label: 'ID' },
							{ key: 'username', label: 'Username' },
							{ key: 'status', label: 'Status' },
							{ key: 'actions', label: 'Actions' }
						],
						rowLayout: (friend) => [
							{
								type: 'label',
								props: {
									text: `${friend.id}`,
									htmlFor: `friend-${friend.id}-id`
								}
							},
							{
								type: 'label',
								props: {
									text: `${friend.username}`,
									htmlFor: `friend-${friend.id}-username`
								}
							},
							{
								type: 'label',
								props: {
									text: friend.status === 'online' ? '🟢 Online' : '🔘 Offline',
									htmlFor: `friend-${friend.id}-status`
								}
							},
							{
								type: 'buttongroup',
								props: {
									buttons: [
										{
											id: `remove-friend-${friend.id}`,
											icon: 'user-minus',
											text: 'Remove',
											type: 'button'
										}
									]
								}
							}
						]
					}
				},
                
			]
		});

        const deleteModal = await new Modal().renderModal({
            id: 'confirm-remove-modal',
            title: 'Remove Friend',
            content: `
                <p>Are you sure you want to remove this friend?<br>
                <strong>This action cannot be undone.</strong></p>
            `,
            footerButtons: [
                {
                    id: 'cancel-remove-btn',
                    text: 'Cancel',
                    className: 'btn btn-secondary',
                    onClick: `document.getElementById('confirm-remove-modal').classList.add('hidden')`
                },
                {
                    id: 'confirm-remove-btn',
                    text: 'Yes, Remove',
                    className: 'btn btn-red'
                }
            ],
            closableOnOutsideClick: true
        });
        const html = await this.render(`${friendsCard}${deleteModal}`);
        setTimeout(() => UserService.attachFriendHandlers(), 0);
        return html;
	}
}
