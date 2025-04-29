import AbstractView from '../../utils/AbstractView.js';
import { themedHeader } from '../theme/themeHelpers.js';
import Button from './Button.js';

export default class Header extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams(window.location.search)) {
		super(params);
	}

	async getHtml(): Promise<string> {
		const isLoginPage = location.pathname === '/login';

		console.log('[Header] Props:', this.props); // For debugging

		// Apply the theme-based class from your CSS
		const themeClass = themedHeader(this.props?.theme || 'default');
		console.log('[Header] Theme Class:', themeClass); // <-- this should show 'header-theme-stars'

		let buttonGroupHtml = '';
		if (!isLoginPage) {
			const button = new Button(this.params);
			buttonGroupHtml = await button.renderGroup({
				layout: 'group',
				align: 'right',
				className: 'no-wrap',
				buttons: [
					{ id: 'home-btn', text: 'Home', href: '/' },
					{ id: 'user-btn', text: 'User Management', href: '/user-mangement' },
					{ id: 'logout-btn', text: 'Logout', href: '/login', className: 'btn btn-danger btn-sm' }
				]
			});
		}

		return super.render(`
			<header class="header ${themeClass}">
				<h1 class="text-2xl font-bold whitespace-nowrap">
				  <a router href="/" class="hover:underline">Transcendence</a>
				</h1>
				${buttonGroupHtml}
			</header>
		  `);

	}
}

// <h1 class="text-2xl font-bold whitespace-nowrap">
// 	<a router href="/" class="hover:underline">Transcendence</a>
// </h1>
// ${buttonGroupHtml}