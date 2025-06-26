import AbstractView from '../../utils/AbstractView.js';
import Button from './Button.js';
import UserService from '../services/UserService.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import Dropdown from '../components/Dropdown.js';
import { AccessibilityService } from '../services/AccessibilityService.js';

export default class Header extends AbstractView {
	constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
		super(routeParams, params);
	}

	async getHtml(): Promise<string> {
		const noMenu = ['/login', '/signup', '/two-factor'];
		const currentUser = await UserService.getCurrentUser();
		const button = new Button();

		// Core buttons
		const buttonSet = !currentUser
			? [
					{ id: 'login-btn', text: window.ls.__('Login'), icon: 'right-to-bracket', href: '/login' },
					{ id: 'signup-btn', text: window.ls.__('Signup'), icon: 'user-plus', href: '/signup' },
			  ]
			: [
					...(currentUser.role === 'master'
						? [
								{
									id: 'user-management-btn',
									text: window.ls.__('User Management'),
									icon: 'users',
									href: '/user-mangement',
								},
						  ]
						: []),
					{ id: 'localpong-btn', text: window.ls.__('Local Pong'), icon: 'table-tennis-paddle-ball', href: '/localpong' },
					{ id: 'lobby-list-btn', text: window.ls.__('Lobby List'), icon: 'list', href: '/lobbylist' },
			  ];

		let buttonGroupHtml = '';
		if (!noMenu.includes(location.pathname)) {
			buttonGroupHtml = await button.renderButtonGroup({
				layout: 'group',
				align: 'right',
				className: 'no-wrap desktopmenu',
				buttons: buttonSet,
			});
		}

		// Language dropdown
		const languageDropdown = await button.renderDropdownGroup({
			id: 'language-dropdown',
			head: {
				icon: '',
				img: '/dist/assets/flags/en_EN.svg',
				text: '',
			},
			items: [
				{ id: 'lang-btn-en_EN', text: window.ls.__('English'), dataAttributes: { lang: 'en_EN' }, img: '/dist/assets/flags/en_EN.svg' },
				{ id: 'lang-btn-de_DE', text: window.ls.__('Deutsch'), dataAttributes: { lang: 'de_DE' }, img: '/dist/assets/flags/de_DE.svg' },
				{ id: 'lang-btn-it_IT', text: window.ls.__('Italiano'), dataAttributes: { lang: 'it_IT' }, img: '/dist/assets/flags/it_IT.svg' },
				{ id: 'lang-btn-my_MY', text: window.ls.__('Malay'), dataAttributes: { lang: 'my_MY' }, img: '/dist/assets/flags/my_MY.svg' },
			],
		});

		// Accessibility dropdown
		const accessibilityDropdown = await button.renderDropdownGroup({
            id: 'accessibility-dropdown',
            head: { icon: 'universal-access', text: window.ls.__('Accessibility') },
            items: [
                {
                    id: 'contrast-btn', // unique ID
                    icon: 'circle-half-stroke',
                    text: window.ls.__('Contrast'),
                    type: 'button',
                    color: 'blue',
                },
                {
                    id: 'textsize-btn', // unique ID
                    icon: 'font',
                    text: window.ls.__('Textsize'),
                    type: 'button',
                    color: 'blue',
                },
            ],
        });        

		// User dropdown
		let userDropDownHtml = '';
		if (currentUser) {
			const userDropdown = new Dropdown();
			userDropDownHtml = await userDropdown.renderDropdown({
				id: 'user-dropdown',
				head: {
					text: currentUser.name,
					img: generateProfileImage(currentUser, 32, 32),
				},
				items: [
					{ type: 'button', href: `/users/${currentUser.id}`, text: window.ls.__('My Profile') },
					{ type: 'button', href: '/friends', text: window.ls.__('Friends') },
					{ type: 'button', href: '/history', text: window.ls.__('Match-History') },
					{ type: 'button', id: 'logout-btn', text: window.ls.__('Logout'), color: 'red' },
				],
			});
		}

		return super.render(`
			<header class="header">
				<div class="container p-1">
					<h1 class="text-inherit font-bold whitespace-nowrap">
						<a router href="/" class="__">Transcendence</a>
					</h1>
					<div class="header-nav">
						${buttonGroupHtml}
						<div class="dropdowns">
							<div class="flex items-center ml-2 desktopmenu">${accessibilityDropdown}</div>
							<div class="flex items-center ml-2 desktopmenu">${languageDropdown}</div>
							<div class="flex items-center ml-2">${userDropDownHtml}</div>
						</div>
					</div>
				</div>
			</header>
		`);
    }    
}
