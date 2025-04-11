// ========================
// File: main.ts
// ========================

// utils
import '../utils/TemplateEngine.js';
import Router from '../utils/Router.js';
import { TemplateEngine } from '../utils/TemplateEngine.js';

// views
import Home from './views/Home.js';
import Pong from './views/Pong.js';
import TicTacToe from './views/TicTacToe.js';
import UserMangement from './views/UserManagement.js';
import Login from './views/Login.js';

// components
import Card from './components/Card.js';
import Button from './components/Button.js';
import Footer from './components/Footer.js';
import Header from './components/Header.js';

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
	const header = new Header();
	const headerHtml = await header.getHtml(); // no props needed for now
	document.getElementById('header-root')!.innerHTML = headerHtml;
}

/**
 * Initial render and background setup on first load
 */
document.addEventListener('DOMContentLoaded', async () => {
	await renderHeader();
	await router.render();
	await renderFooter();
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
		path: '/pong',
		view: Pong,
		metadata: {
			title: 'Transcendence - Pong',
			description: 'Welcome to Pong'
		}
	},
	{
		path: '/tictactoe',
		view: TicTacToe,
		metadata: {
			title: 'Transcendence - TicTacToe',
			description: 'Welcome to TicTacToe'
		}
	},
	{
		path: '/user-mangement',
		view: UserMangement,
		metadata: {
			title: 'Transcendence - UserMangement',
			description: 'Welcome to UserMangement'
		}
	},
	{
		path: '/login',
		view: Login,
		metadata: {
			title: 'Transcendence - login',
			description: 'Welcome to Login'
		}
	}
];

const router = new Router(routes);
