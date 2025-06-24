import AbstractView from '../../utils/AbstractView.js';
import Modal from '../components/Modal.js';
import Card from '../components/Card.js';
import UserService from '../services/UserService.js';
import { FriendList } from '../../interfaces/userManagementInterfaces.js';
import Router from '../../utils/Router.js';

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
                        className: 'hidden'
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
                            { key: 'avatar', label: window.ls.__('Avatar') },
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
                                type: 'avatar',
                                props: {
                                    src: friend.avatar || '',
                                    size: 30,
                                    className: 'mx-auto'
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

        return await this.render(`${friendsCard}${deleteModal}`);
    }

    async mount(): Promise<void> {
        const addBtn = document.getElementById('add-friend-btn');
        const input = document.querySelector<HTMLInputElement>('input[name="username"]');
        const feedback = document.getElementById('friend-feedback');

        if (addBtn && input) {
            addBtn.addEventListener('click', async () => {
                const username = input.value.trim();
                if (!username) {
                    feedback!.textContent = 'Please enter a username.';
                    feedback!.classList.remove('hidden', 'text-green-500');
                    feedback!.classList.add('text-red-500');
                    return;
                }

                const success = await UserService.addFriendByUsername(username);
                if (success) {
                    feedback!.textContent = 'Friend added successfully.';
                    feedback!.classList.remove('hidden', 'text-red-500');
                    feedback!.classList.add('text-green-500');
                    setTimeout(() => Router.update(), 1000);
                } else {
                    feedback!.textContent = 'Failed to add friend.';
                    feedback!.classList.remove('hidden', 'text-green-500');
                    feedback!.classList.add('text-red-500');
                }
            });

            input.addEventListener('input', () => {
                feedback!.classList.add('hidden');
                feedback!.textContent = '';
            });

            input.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addBtn.click();
                }
            });
        }

        document.querySelectorAll('[id^="remove-friend-"]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = Number(btn.id.split('remove-friend-')[1]);
                if (isNaN(id)) return;

                UserService.setSelectedFriendId(id);
                const modal = document.getElementById('confirm-remove-modal');
                if (modal) {
                    modal.classList.remove('hidden');
                }
            });
        });

        const modal = document.getElementById('confirm-remove-modal');
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                    UserService.setSelectedFriendId(null);
                }
            };
        }

        const confirmBtn = document.getElementById('confirm-remove-btn');
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                const selectedId = UserService.getSelectedFriendId();
                if (selectedId === null) return;

                const success = await UserService.removeFriendById(selectedId);
                if (success) {
                    Router.update();
                } else {
                    modal?.classList.add('hidden');
                }
                UserService.setSelectedFriendId(null);
            };
        }

        const cancelBtn = document.getElementById('cancel-remove-btn');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                modal?.classList.add('hidden');
                UserService.setSelectedFriendId(null);
            };
        }
    }
}
