import AbstractView from '../../utils/AbstractView.js';
import { themedHeader } from '../theme/themeHelpers.js';
import Button from './Button.js';
import { UserManagementService } from '../services/user_management.js';
import { generateProfileImage } from '../../utils/Avartar.js';

export default class Header extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams(window.location.search)) {
		super(params);
	}


	async getHtml(): Promise<string> {
		const noMenu = ['/login', '/signup'];

		// Apply the theme-based class from your CSS
		const themeClass = themedHeader(this.props?.theme || 'default');
		const currentUser = await UserManagementService.getCurrentUser();
		let buttonSet = [
			{ id: 'login-btn', text: 'Login', href: '/login', className: 'btn btn-sm' },
			{ id: 'signup-btn', text: 'Signup', href: '/signup', className: 'btn btn-sm' }
		];
		if (currentUser != null) {
			if (currentUser.role == 'admin' || currentUser.role == 'master') {

				buttonSet = [
					{ id: 'user-btn', text: 'User Management', href: '/user-mangement', className: "btn btn-sm" }
				]
			}
			else {
				buttonSet = []
			}
		}

		let buttonGroupHtml = '';
		if (!noMenu.includes(location.pathname)) {
			const button = new Button(this.params);
			buttonGroupHtml = await button.renderGroup({
				layout: 'group',
				align: 'right',
				className: 'no-wrap',
				buttons: buttonSet
			});
		}

		let dropDown = ""
		if (currentUser) {
			let dropDownAvatar = generateProfileImage(currentUser, 20, 20);
			dropDown = `<div class="dropdown">
				<div class="dropdown-head">
					<a router href="/users/${currentUser.id}">
						<div class="dropdown-name">
							Howdy, ${currentUser.displayname}
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
			<header class="header ${themeClass}">
				<h1 class="text-2xl font-bold whitespace-nowrap">
				  <a router href="/" class="hover:underline">Transcendence</a>
				</h1>
				<div class="header-nav">
					${buttonGroupHtml}
					${dropDown}
				</div>
			</header>
		  `);

	}
}

// <h1 class="text-2xl font-bold whitespace-nowrap">
// 	<a router href="/" class="hover:underline">Transcendence</a>
// </h1>
// ${buttonGroupHtml}
