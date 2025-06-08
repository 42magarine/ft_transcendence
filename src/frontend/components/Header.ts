import AbstractView from '../../utils/AbstractView.js';
import Button from './Button.js';
import UserService from '../services/UserService.js';
import { generateProfileImage } from '../../utils/Avatar.js';

export default class Header extends AbstractView {
    constructor(params: URLSearchParams = new URLSearchParams(window.location.search)) {
        super(params);
    }

    async getHtml(): Promise<string> {
        const noMenu = ['/login', '/signup', '/two-factor'];

        const currentUser = await UserService.getCurrentUser();
        let buttonSet = [
            {
                id: 'login-btn',
                text: 'Login',
                icon: 'right-to-bracket',
                href: '/login'
            },
            {
                id: 'signup-btn',
                text: 'Signup',
                icon: 'user-plus',
                href: '/signup'
            }
        ];

        if (currentUser != null) {
            if (currentUser.role === 'master') {
                buttonSet = [
                    {
                        id: 'friends-btn',
                        text: 'Friends List',
                        icon: 'user-group',
                        href: '/friends',
                    },
                    {
                        id: 'user-management-btn',
                        text: 'User Management',
                        icon: 'users',
                        href: '/user-mangement'
                    },
                    {
                        id: 'localpong-btn',
                        text: 'Local Pong',
                        icon: 'table-tennis-paddle-ball',
                        href: '/localpong'
                    },
                    {
                        id: 'lobby-list-btn',
                        text: 'Lobby List',
                        icon: 'list',
                        href: '/lobbylist'
                    },
                    {
                        id: 'tournament-list-btn',
                        text: 'Tournament List',
                        icon: 'list',
                        href: '/tournamentlist'
                    }
                ];
            }
            else {
                buttonSet = [
                    {
                        id: 'friends-btn',
                        text: 'Friends List',
                        icon: 'user-group',
                        href: '/friends',
                    },
                    {
                        id: 'localpong-btn',
                        text: 'Local Pong',
                        icon: 'table-tennis-paddle-ball',
                        href: '/localpong'
                    },
                    {
                        id: 'lobby-list-btn',
                        text: 'Lobby List',
                        icon: 'list',
                        href: '/lobbylist'
                    },
                    {
                        id: 'tournament-list-btn',
                        text: 'Tournament List',
                        icon: 'list',
                        href: '/tournamentlist'
                    }
                ];
            }
        }


        let buttonGroupHtml = '';
        if (!noMenu.includes(location.pathname)) {
            const button = new Button();
            buttonGroupHtml = await button.renderButtonGroup(
                {
                    layout: 'group',
                    align: 'right',
                    className: 'no-wrap',
                    buttons: buttonSet
                });
        }
        let baseUrl = window.location.protocol + "//" + window.location.host;
        let languageDropDown = `<div class="dropdown">
				<div class="dropdown-head">
					<img class="flag active" data-lang="en_EN" src="${baseUrl}/dist/assets/flags/en_EN.svg" />
				</div>
				<div class="dropdown-body">
					<div class="dropdown-item">
						<img class="flag passive" data-lang="de_DE" src="${baseUrl}/dist/assets/flags/de_DE.svg" />
					</div>
					<div class="dropdown-item">
						<img class="flag passive" data-lang="it_IT" src="${baseUrl}/dist/assets/flags/it_IT.svg" />
					</div>
				</div>
			</div>
			`

        let userDropDown = ""
        if (currentUser) {
            let dropDownAvatar = generateProfileImage(currentUser, 20, 20);
            userDropDown = `<div class="dropdown">
				<div class="dropdown-head">
					<a router href="/users/${currentUser.id}">
						<div class="dropdown-name">
							${currentUser.name}
						</div>
						<div class="dropdown-img">
							${dropDownAvatar}
						</div>
					</a>
				</div>
				<div class="dropdown-body">
					<div class="dropdown-item">
						<a router href="/users/${currentUser.id}">My Profile</a>
					</div>
					<div class="dropdown-item">
						<a router href="/users/friends">Friends</a>
					</div>
					<div class="dropdown-item">
						<button id="logout-btn" type="button" class="btn btn-red btn-sm">Logout</button>
					</div>
				</div>
			</div>
			`
        }

        //{ id: 'logout-btn', text: 'Logout', href: '', className: 'btn btn-red btn-sm' }
        return super.render(`
			<header class="header">
				<h1 class="text-2xl font-bold whitespace-nowrap">
				<a router href="/" class="hover:underline">Transcendence</a>
				</h1>
				<div class="header-nav">
					${buttonGroupHtml}
					<div class="flex items-center">
						${languageDropDown}
					</div>
					<div class="flex items-center ml-2">
						${userDropDown}
					</div>
				</div>
			</header>
		`);
    }
}
