import AbstractView from '../../utils/AbstractView.js';
import Button from './Button.js';
import UserService from '../services/UserService.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import renderAvatar from '../components/Avatar.js';
import Router from '../../utils/Router.js';
import Dropdown from '../components/Dropdown.js';
import { AccessibilityService } from '../services/AccessibilityService.js';

export default class Header extends AbstractView {
    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
    }

    async getHtml(): Promise<string> {
        const noMenu = ['/login', '/signup', '/two-factor'];
        const currentUser = await UserService.getCurrentUser();

        let buttonSet = [
            {
                id: 'login-btn',
                text: window.ls.__('Login'),
                icon: 'right-to-bracket',
                href: '/login',
            },
            {
                id: 'signup-btn',
                text: window.ls.__('Signup'),
                icon: 'user-plus',
                href: '/signup',
            },
        ];

        if (currentUser) {
            buttonSet = [
                {
                    id: 'localpong-btn',
                    text: window.ls.__('Local Pong'),
                    icon: 'table-tennis-paddle-ball',
                    href: '/localpong',
                },
                {
                    id: 'lobby-list-btn',
                    text: window.ls.__('Lobby List'),
                    icon: 'list',
                    href: '/lobbylist',
                },
            ];
            if (currentUser.role === 'master') {
                buttonSet.unshift({
                    id: 'user-management-btn',
                    text: window.ls.__('User Management'),
                    icon: 'users',
                    href: '/user-mangement',
                });
            }
        }

        const langItems = [
            { img: `/dist/assets/flags/en_EN.svg`, text: window.ls.__('English'), dataAttributes: { lang: 'en_EN' } },
            { img: `/dist/assets/flags/de_DE.svg`, text: window.ls.__('Deutsch'), dataAttributes: { lang: 'de_DE' } },
            { img: `/dist/assets/flags/it_IT.svg`, text: window.ls.__('Italiano'), dataAttributes: { lang: 'it_IT' } },
            { img: `/dist/assets/flags/my_MY.svg`, text: window.ls.__('Malay'), dataAttributes: { lang: 'my_MY' } },
        ];

        const accessibilityItems = [
            { icon: 'circle-half-stroke', text: window.ls.__('Contrast'), className: 'contrastSwitch' },
            { icon: 'font', text: window.ls.__('Textsize'), className: 'textsizeSwitch' },
        ];

        const langButtons = langItems.map((item) => ({
            id: `lang-btn-${item.dataAttributes.lang}`,
            text: item.text,
            icon: 'globe',
            href: '#',
            className: 'mobilemenu',
            dataAttributes: item.dataAttributes,
            img: item.img,
        }));

        const accessibilityButtons = accessibilityItems.map((item) => ({
            id: '',
            text: item.text,
            icon: item.icon,
            className: 'mobilemenu ' + item.className,
            href: '#',
        }));

        buttonSet.push(...langButtons);
        buttonSet.push(...accessibilityButtons);

        const button = new Button();

        const languageDropdown = await button.renderDropdownGroup({
            id: 'language-dropdown',
            head: {
                icon: '',
                img: `/dist/assets/flags/en_EN.svg`,
                text: '',
            },
            items: langItems,
        });

        const accessibilityDropdown = await button.renderDropdownGroup({
            id: 'accessibility-dropdown',
            head: {
                icon: 'universal-access',
                text: window.ls.__('Accessibility'),
            },
            items: accessibilityItems,
        });

        const hamburgerDropdown = await button.renderDropdownGroup({
            id: 'hamburger-dropdown',
            head: {
                icon: 'bars',
                text: window.ls.__('Menu'),
            },
            items: buttonSet,
        });

        let buttonGroupHtml = '';
        if (!noMenu.includes(location.pathname)) {
            buttonGroupHtml = await button.renderButtonGroup({
                layout: 'group',
                align: 'right',
                className: 'no-wrap desktopmenu',
                buttons: buttonSet,
            });
        }

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
                            <div class="flex items-center ml-2 mobilemenu">${hamburgerDropdown}</div>
                            <div class="flex items-center ml-2 desktopmenu">${accessibilityDropdown}</div>
                            <div class="flex items-center ml-2 desktopmenu">${languageDropdown}</div>
                            <div class="flex items-center ml-2">${userDropDownHtml}</div>
                        </div>
                    </div>
                </div>
            </header>
        `);
    }

    async mount(): Promise<void> {
        const logoutButton = document.getElementById('logout-btn') as HTMLElement | null;
        if (logoutButton) {
            logoutButton.addEventListener('click', async (e) => {
                e.preventDefault();
                await window.userManagementService.logout();
            });
        }
        window.ls.langSelectAction();
        AccessibilityService.initialize();

    }

}
