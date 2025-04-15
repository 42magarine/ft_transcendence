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
import UserManagement from './views/UserManagement.js';
import Login from './views/Login.js';
import Settings from './views/Settings.js';
// components
import Card from './components/Card.js';
import Button from './components/Button.js';
import Footer from './components/Footer.js';
import Header from './components/Header.js';
const globalTemplateEngine = new TemplateEngine();
globalTemplateEngine.registerComponent('Card', Card);
globalTemplateEngine.registerComponent('Button', Button);
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
        path: '/user-management',
        view: UserManagement,
        metadata: {
            title: 'Transcendence - UserManagement',
            description: 'Welcome to UserManagement'
        }
    },
    {
        path: '/login',
        view: Login,
        metadata: {
            title: 'Transcendence - login',
            description: 'Welcome to Login'
        }
    },
    {
        path: '/settings',
        view: Settings,
        metadata: {
            title: 'Transcendence - settings',
            description: 'Welcome to Settings'
        }
    }
];
const router = new Router(routes);
/**
 * Dynamically render the header into <header id="header-root">
 */
async function renderHeader(theme) {
    const header = new Header();
    const headerHtml = await header.renderWithProps({ theme });
    document.getElementById('header-root').innerHTML = headerHtml;
}
/**
 * Dynamically render the footer into <footer id="footer-root">
 */
async function renderFooter(theme) {
    const footer = new Footer();
    const footerHtml = await footer.renderWithProps({
        theme,
        year: '2025',
        links: [
            { text: 'Privacy', href: '/privacy' },
            { text: 'Terms', href: '/terms' },
            { text: 'Imprint', href: '/imprint' }
        ]
    });
    document.getElementById('footer-root').innerHTML = footerHtml;
}
/**
 * Initial render and background setup on first load
 */
document.addEventListener('DOMContentLoaded', async () => {
    await router.render(); // render still returns void — that's okay!
    // ⬇️ Access the current view via router
    const theme = router['currentView']?.getTheme?.() || 'default';
    const header = new Header();
    const footer = new Footer();
    const headerHtml = await header.renderWithProps({ theme });
    const footerHtml = await footer.renderWithProps({ theme });
    document.getElementById('header-root').innerHTML = headerHtml;
    document.getElementById('footer-root').innerHTML = footerHtml;
});
