import AbstractView from '../../utils/AbstractView.js';
import Button from './Button.js';
import UserService from '../services/UserService.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import __ from '../services/LanguageService.js';

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
                text: window.ls.__('Login'),
                icon: 'right-to-bracket',
                href: '/login'
            },
            {
                id: 'signup-btn',
                text: window.ls.__('Signup'),
                icon: 'user-plus',
                href: '/signup'
            }
        ];

        if (currentUser != null) {
            if (currentUser.role === 'master') {
                buttonSet = [
                    {
                        id: 'friends-btn',
                        text: window.ls.__('Friends List'),
                        icon: 'user-group',
                        href: '/friends',
                    },
                    {
                        id: 'user-management-btn',
                        text: window.ls.__('User Management'),
                        icon: 'users',
                        href: '/user-mangement'
                    },
                    {
                        id: 'localpong-btn',
                        text: window.ls.__('Local Pong'),
                        icon: 'table-tennis-paddle-ball',
                        href: '/localpong'
                    },
                    {
                        id: 'lobby-list-btn',
                        text: window.ls.__('Lobby List'),
                        icon: 'list',
                        href: '/lobbylist'
                    },
                    {
                        id: 'tournament-list-btn',
                        text: window.ls.__('Tournament List'),
                        icon: 'list',
                        href: '/tournamentlist'
                    }
                ];
            } else {
                buttonSet = [
                    {
                        id: 'friends-btn',
                        text: window.ls.__('Friends List'),
                        icon: 'user-group',
                        href: '/friends',
                    },
                    {
                        id: 'localpong-btn',
                        text: window.ls.__('Local Pong'),
                        icon: 'table-tennis-paddle-ball',
                        href: '/localpong'
                    },
                    {
                        id: 'lobby-list-btn',
                        text: window.ls.__('Lobby List'),
                        icon: 'list',
                        href: '/lobbylist'
                    },
                    {
                        id: 'tournament-list-btn',
                        text: window.ls.__('Tournament List'),
                        icon: 'list',
                        href: '/tournamentlist'
                    }
                ];
            }
        }

        const button = new Button();
        const languageDropDown = await button.renderLanguageDropdown();

        let buttonGroupHtml = '';
        if (!noMenu.includes(location.pathname)) {
            buttonGroupHtml = await button.renderButtonGroup({
                layout: 'group',
                align: 'right',
                className: 'no-wrap',
                buttons: buttonSet
            });
        }

        let userDropDown = "";
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
						<a router href="/users/${currentUser.id}">${window.ls.__('My Profile')}</a>
					</div>
					<div class="dropdown-item">
						<a router href="/users/friends">${window.ls.__('Friends')}</a>
					</div>
					<div class="dropdown-item">
						<button id="logout-btn" type="button" class="btn btn-red btn-sm">${window.ls.__('Logout')}</button>
					</div>
				</div>
			</div>`;
        }

        let viewSettings = [
            {
                id: 'contrastSwitch',
                text: 'Contrast',
                icon: 'circle-half-stroke',
                href: ''
            },
            {
                id: 'textsizeSwitch',
                text: 'Textsize',
                icon: 'font',
                href: ''
            }
        ];
        let viewSettingsHtml = '';
        viewSettingsHtml = await button.renderButtonGroup(
            {
                layout: 'group',
                align: 'right',
                className: 'no-wrap',
                buttons: viewSettings
            });
        return super.render(`
			<header class="header">
				<h1 class="text-2xl font-bold whitespace-nowrap">
					<a router href="/" class="__">Transcendence</a>
				</h1>
				<div class="header-nav">
					${buttonGroupHtml}
                    ${viewSettingsHtml}
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
