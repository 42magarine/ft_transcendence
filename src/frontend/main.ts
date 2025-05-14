// ========================
// File: main.ts
// ========================

// services
import './services/UserManagementService.js';

// utils
import '../utils/table.js';
import '../utils/TemplateEngine.js';
import Router from '../utils/Router.js';
import { TemplateEngine } from '../utils/TemplateEngine.js';

// views
import Home from './views/Home.js';
import Demo from './views/Demo.js';
import Pong from './views/Pong.js';
import Profile from './views/Profile.js';
import ProfileEdit from './views/ProfileEdit.js';
import UserMangement from './views/UserManagement.js';
import Login from './views/Login.js';
import Settings from './views/Settings.js';
import Signup from './views/Signup.js';
import PasswordReset from './views/PasswordReset.js';

// components
import Card from './components/Card.js';
import Button from './components/Button.js';
import Footer from './components/Footer.js';
import Header from './components/Header.js';
import TwoFactorLogin from './views/TwoFactorLogin.js';
import LobbyList from './views/LobbyList.js';

const globalTemplateEngine = new TemplateEngine();
globalTemplateEngine.registerComponent('Card', Card);
globalTemplateEngine.registerComponent('Button', Button);

/**
 * Dynamically render the footer into <footer id="footer-root">
 */
async function renderFooter() {
	const footer = new Footer();
	const footerHtml = await footer.renderWithProps({
		year: '2025',
		links: [
			{ text: 'Privacy', href: '/privacy' },
			{ text: 'Terms', href: '/terms' },
			{ text: 'Imprint', href: '/imprint' }
		]
	});
	document.getElementById('footer-root')!.innerHTML = footerHtml;
}

/**
 * Dynamically render the header into <header id="header-root">
 */
async function renderHeader() {
	const header = new Header(new URLSearchParams(window.location.search));
	const headerHtml = await header.getHtml();
	document.getElementById('header-root')!.innerHTML = headerHtml;
}

/**
 * Initial render and background setup on first load
 */
document.addEventListener('DOMContentLoaded', async () => {
	await renderHeader();
	await renderFooter();
	await router.render();
});

const routes = [
	{
		path: '/',
		view: Home,
		metadata: {
			title: 'Transcendence',
			description: 'Welcome to Transcendence - the ultimate gaming experience'
		}
	},
	{
		path: '/demo',
		view: Demo,
		metadata: {
			title: 'Transcendence',
			description: 'Welcome to Transcendence - the ultimate gaming experience'
		}
	},
	{
		path: '/pong',
		role: 'user',
		view: Pong,
		metadata: {
			title: 'Transcendence - Pong',
			description: 'Welcome to Pong'
		}
	},
	{
		path: '/lobbylist',
		role: 'user',
		view: LobbyList,
		metadata: {
			title: 'Transcendence - Lobby',
			description: 'Invite players to matches'
		}
	},
	{
		path: '/user-mangement',
		role: 'admin',
		view: UserMangement,
		metadata: {
			title: 'Transcendence - UserMangement',
			description: 'Welcome to UserMangement'
		}
	},
	{
		path: '/users/:id',
		role: 'user_id',
		view: Profile,
		metadata: {
			title: 'Transcendence - User Detail',
			description: 'User Detail View'
		}
	},
	{
		path: '/users/edit/:id',
		role: 'user_id',
		view: ProfileEdit,
		metadata: {
			title: 'Transcendence - User Edit',
			description: 'User Edit View'
		}
	},
	{
		path: '/login',
		role: 'logged_out',
		view: Login,
		metadata: {
			title: 'Transcendence - login',
			description: 'Welcome to Login'
		}
	},
	{
		path: '/two-factor',
		role: 'logged_out',
		view: TwoFactorLogin,
		metadata: {
			title: 'Transcendence - 2FA Login',
			description: 'Welcome to 2FA Login'
		}
	},
	{
		path: '/password-reset',
		role: 'logged_out',
		view: PasswordReset,
		metadata: {
			title: 'Transcendence - Password Reset',
			description: 'Welcome to Password Reset'
		}
	},
	{
		path: '/password-reset/:token',  // Added new route with token parameter
		role: 'logged_out',
		view: PasswordReset,
		metadata: {
			title: 'Transcendence - Reset Your Password',
			description: 'Reset your password with the provided token'
		}
	},
	{
		path: '/signup',
		role: 'logged_out',
		view: Signup,
		metadata: {
			title: 'Transcendence - Signup',
			description: 'Welcome to Signup'
		}
	},
	{
		path: '/settings',
		role: 'user_id',
		view: Settings,
		metadata: {
			title: 'Transcendence - settings',
			description: 'Welcome to Settings'
		}
	}
];
const router = new Router(routes);

(window as any).router = router;
