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

        // Buttons visible depending on login state
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

        if (currentUser) {
            buttonSet = [
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

            if (currentUser.role === 'master') {
                buttonSet.unshift({
                    id: 'user-management-btn',
                    text: window.ls.__('User Management'),
                    icon: 'users',
                    href: '/user-mangement'
                });
            }
        }

        const button = new Button();

        // Language dropdown (modular)
        const languageDropdown = await button.renderDropdownGroup({
            id: 'language-dropdown',
            head: {
                icon: '',
                img: `/dist/assets/flags/en_EN.svg`,
                text: ''
            },
            items: [
                { img: `/dist/assets/flags/en_EN.svg`, text: window.ls.__('English'), dataAttributes: { lang: 'en_EN' } },
                { img: `/dist/assets/flags/de_DE.svg`, text: window.ls.__('Deutsch'), dataAttributes: { lang: 'de_DE' } },
                { img: `/dist/assets/flags/it_IT.svg`, text: window.ls.__('Italiano'), dataAttributes: { lang: 'it_IT' } },
                { img: `/dist/assets/flags/my_MY.svg`, text: window.ls.__('Malay'), dataAttributes: { lang: 'my_MY' } }
            ]
        });

        // Accessibility dropdown (modular)
        const accessibilityDropdown = await button.renderDropdownGroup({
            id: 'accessibility-dropdown',
            head: {
                icon: 'universal-access',
                text: window.ls.__('Accessibility')
            },
            items: [
                { icon: 'circle-half-stroke', text: window.ls.__('Contrast'), id: 'contrastSwitch' },
                { icon: 'font', text: window.ls.__('Textsize'), id: 'textsizeSwitch' }
            ]
        });

        // Top nav buttons
        let buttonGroupHtml = '';
        if (!noMenu.includes(location.pathname)) {
            buttonGroupHtml = await button.renderButtonGroup({
                layout: 'group',
                align: 'right',
                className: 'no-wrap',
                buttons: buttonSet
            });
        }

        // User profile dropdown
        let userDropDown = "";
        if (currentUser) {
            let dropDownAvatar = generateProfileImage(currentUser, 20, 20);
            userDropDown = `
			<div class="dropdown">
				<div class="dropdown-head">
					<a router href="/users/${currentUser.id}">
						<div class="dropdown-name">${currentUser.name}</div>
						<div class="dropdown-img">${dropDownAvatar}</div>
					</a>
				</div>
				<div class="dropdown-body">
					<div class="dropdown-item">
						<a router href="/users/${currentUser.id}">${window.ls.__('My Profile')}</a>
					</div>
					<div class="dropdown-item">
						<a router href="/friends">${window.ls.__('Friends')}</a>
					</div>
					<div class="dropdown-item">
						<button id="logout-btn" type="button" class="btn btn-red btn-sm">${window.ls.__('Logout')}</button>
					</div>
				</div>
			</div>`;
        }

        return super.render(`
			<header class="header">
				<h1 class="text-2xl font-bold whitespace-nowrap">
					<a router href="/" class="__">Transcendence</a>
				</h1>
				<div class="header-nav">
					${buttonGroupHtml}
					<div class="flex items-center ml-2">${accessibilityDropdown}</div>
					<div class="flex items-center ml-2">${languageDropdown}</div>
					<div class="flex items-center ml-2">${userDropDown}</div>
				</div>
			</header>
		`);
    }
}
