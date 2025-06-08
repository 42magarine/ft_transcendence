import AbstractView from '../../utils/AbstractView.js';
import Modal from '../components/Modal.js';
import Card from '../components/Card.js';
import UserService from '../services/UserService.js';
import { FriendList } from '../../interfaces/userManagementInterfaces.js';
import __ from '../services/LanguageService.js';

export default class Friends extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const friends: FriendList[] = await UserService.getFriends?.() ?? [];

        const friendsCard = await new Card().renderCard({
            title: __('Friends'),
            formId: 'friend-form',
            contentBlocks: [
                {
                    type: 'inputgroup',
                    props: {
                        inputs: [
                            {
                                id: 'friend-username',
                                name: 'username',
                                label: __('Username'),
                                placeholder: __('Search for a friend...')
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
                                text: __('Add as Friend'),
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
                        title: __('Your Friends'),
                        height: '300px',
                        data: friends,
                        columns: [
                            { key: 'id', label: __('ID') },
                            { key: 'username', label: __('Username') },
                            { key: 'status', label: __('Status') },
                            { key: 'actions', label: __('Actions') }
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
                                    text: friend.online === true ? __('🟢 Online') : __('🔘 Offline'),
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
                                            text: __('Remove'),
                                            type: 'button'
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        });

        const deleteModal = await new Modal().renderModal({
            id: 'confirm-remove-modal',
            title: __('Remove Friend'),
            content: `
                <p>${__('Are you sure you want to remove this friend?')}<br>
                <strong>${__('This action cannot be undone.')}</strong></p>
            `,
            footerButtons: [
                {
                    id: 'cancel-remove-btn',
                    text: __('Cancel'),
                    className: 'btn btn-secondary',
                    onClick: `document.getElementById('confirm-remove-modal').classList.add('hidden')`
                },
                {
                    id: 'confirm-remove-btn',
                    text: __('Yes, Remove'),
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
