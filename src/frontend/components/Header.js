// ========================
// File: components/Header.ts
// ========================
import AbstractView from '../../utils/AbstractView.js';
import Button from './Button.js';
export default class Header extends AbstractView {
    constructor(params = new URLSearchParams()) {
        super(params);
    }
    async getHtml() {
        const isLoginPage = location.pathname === '/login';
        const theme = this.props.theme || 'stars'; // ✅ fallback if missing
        const themeClass = `header-theme-${theme}`;
        let buttonHtml = '';
        if (!isLoginPage) {
            buttonHtml = await new Button(new URLSearchParams({ theme })).renderGroup({
                align: 'right',
                buttons: [
                    {
                        id: 'btn-home',
                        text: 'Home',
                        className: `btn btn-secondary btn-theme-${theme}`,
                        onClick: `window.location.href='/'`
                    },
                    {
                        id: 'btn-user',
                        text: 'User Management',
                        className: `btn btn-secondary btn-theme-${theme}`,
                        onClick: `window.location.href='/user-management'`
                    },
                    {
                        id: 'btn-logout',
                        text: 'Logout',
                        className: `btn btn-secondary btn-theme-${theme === 'mechazilla' ? 'starship' : theme}`,
                        onClick: `window.location.href='/login'`
                    }
                ]
            });
        }
        return super.render(`
			<div class="${themeClass} shadow-lg p-8 w-full">
				<div class="flex justify-between items-center px-4 sm:px-6">
					<h1 class="text-2xl font-bold whitespace-nowrap">
						<a router href="/" class="hover:underline">Transcendence</a>
					</h1>
					${buttonHtml}
				</div>
			</div>
		`);
    }
}
