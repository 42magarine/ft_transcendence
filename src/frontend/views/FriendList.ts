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
            title: window.ls.__('Friends'),
            formId: 'friend-form',
            contentBlocks: [
                {
                    type: 'inputgroup',
                    props: {
                        inputs: [
                            {
                                id: 'friend-username',
                                name: 'username',
                                label: window.ls.__('Username'),
                                placeholder: window.ls.__('Search for a friend...')
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
                                text: window.ls.__('Add as Friend'),
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
                        title: window.ls.__('Your Friends'),
                        height: '300px',
                        data: friends,
                        columns: [
                            { key: 'id', label: window.ls.__('ID') },
                            { key: 'username', label: window.ls.__('Username') },
                            { key: 'status', label: window.ls.__('Status') },
                            { key: 'actions', label: window.ls.__('Actions') }
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
                                    text: friend.online === true ? window.ls.__('🟢 Online') : window.ls.__('🔘 Offline'),
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
                                            text: window.ls.__('Remove'),
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
            title: window.ls.__('Remove Friend'),
            content: `
                <p>${window.ls.__('Are you sure you want to remove this friend?')}<br>
                <strong>${window.ls.__('This action cannot be undone.')}</strong></p>
            `,
            footerButtons: [
                {
                    id: 'cancel-remove-btn',
                    text: window.ls.__('Cancel'),
                    className: 'btn btn-secondary',
                    onClick: `document.getElementById('confirm-remove-modal').classList.add('hidden')`
                },
                {
                    id: 'confirm-remove-btn',
                    text: window.ls.__('Yes, Remove'),
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
