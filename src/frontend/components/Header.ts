import AbstractView from '../../utils/AbstractView.js';
import Button from './Button.js';
import { UserManagementService } from '../services/UserManagementService.js';
import { generateProfileImage } from '../../utils/Avatar.js';

export default class Header extends AbstractView {
    constructor(params: URLSearchParams = new URLSearchParams(window.location.search)) {
        super(params);
    }

    async getHtml(): Promise<string> {
        const noMenu = ['/login', '/signup', '/two-factor'];

        const currentUser = await UserManagementService.getCurrentUser();
        let buttonSet = [
            { id: 'login-btn', text: 'Login', href: '/login', className: 'btn btn-sm' },
            { id: 'signup-btn', text: 'Signup', href: '/signup', className: 'btn btn-sm' }
        ];
        if (currentUser != null) {
            if (currentUser.role == 'admin' || currentUser.role == 'master') {

                buttonSet = [
                    { id: 'user-btn', text: 'Local Pong', href: '/ponglocal', className: "btn btn-sm" },
                    { id: 'user-btn', text: 'User Management', href: '/user-mangement', className: "btn btn-sm" },
                    { id: 'user-btn', text: 'Lobby List', href: '/lobbylist', className: "btn btn-sm" }
                ]
            }
            else {
                buttonSet = [
                    { id: 'user-btn', text: 'Local Pong', href: '/ponglocal', className: "btn btn-sm" },
                    { id: 'user-btn', text: 'Lobby List', href: '/lobbylist', className: "btn btn-sm" }
                ]
            }
        }

        let buttonGroupHtml = '';
        if (!noMenu.includes(location.pathname)) {
            const button = new Button();
            buttonGroupHtml = await button.renderGroup({
                layout: 'group',
                align: 'right',
                className: 'no-wrap',
                buttons: buttonSet
            });
        }

        let languageDropDown = `<div class="dropdown">
				<div class="dropdown-head">
					<img class="flag active" data-lang="en_EN" src="https://${window.location.host}/dist/assets/flags/en_EN.svg" />
				</div>
				<div class="dropdown-body">
					<div class="dropdown-item">
						<img class="flag passive" data-lang="de_DE" src="https://${window.location.host}/dist/assets/flags/de_DE.svg" />
					</div>
					<div class="dropdown-item">
						<img class="flag passive" data-lang="it_IT" src="https://${window.location.host}/dist/assets/flags/it_IT.svg" />
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
							${currentUser.displayname}
						</div>
						<div class="dropdown-img">
							${dropDownAvatar}
						</div>
					</a>
				</div>
				<div class="dropdown-body">
					<div class="dropdown-item">
						<a router href="/users/${currentUser.id}">Profile</a>
					</div>
					<div class="dropdown-item">
						<button id="logout-btn" type="button" class="btn btn-danger btn-sm">Logout</button>
					</div>
				</div>
			</div>
			`
        }

        //{ id: 'logout-btn', text: 'Logout', href: '', className: 'btn btn-danger btn-sm' }
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

// <h1 class="text-2xl font-bold whitespace-nowrap">
// 	<a router href="/" class="hover:underline">Transcendence</a>
// </h1>
// ${buttonGroupHtml}
