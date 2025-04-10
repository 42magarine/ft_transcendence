// utils
import '../utils/TemplateEngine.js';
import Router from '../utils/Router.js';
import { TemplateEngine } from '../utils/TemplateEngine.js';

// views
import Home from './views/Home.js';
import Pong from './views/Pong.js';
import TicTacToe from './views/TicTacToe.js';
import UserMangement from './views/UserManagement.js';

// components
import Card from './components/Card.js';
import Button from './components/Button.js';
import Footer from './components/Footer.js';
import Header from './components/Header.js';
import { setBackgroundImage } from './components/BackgroundManager.js';

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
 * Update background dynamically based on current route
 */
function updateBackgroundByRoute(path: string) {
    switch (path) {
        case '/pong':
            setBackgroundImage('/assets/backgrounds/pong.png');
            break;
        case '/tictactoe':
            setBackgroundImage('/assets/backgrounds/tictactoe.png');
            break;
        case '/user-mangement':
            setBackgroundImage('/assets/backgrounds/home.png');
            break;
        default:
            setBackgroundImage('/assets/backgrounds/home.png');
    }
}

/**
 * Initial render and background setup on first load
 */
document.addEventListener('DOMContentLoaded', async () => {
    await renderHeader();
    await router.render();
    await renderFooter();
    updateBackgroundByRoute(location.pathname);
    setThemeByRoute(location.pathname);
});

type RouteKey = '/' | '/pong' | '/tictactoe' | '/user-mangement';


const themeByRoute: Record<RouteKey, {
    header: string;
    footer: string;
    card: string;
}> = {
    '/pong': {
        header: 'bg-gradient-to-r from-zinc-900/70 via-gray-800/70 to-zinc-700/70 text-white backdrop-blur-md',
        footer: 'bg-gradient-to-r from-zinc-900/70 via-gray-800/70 to-zinc-700/70 text-white backdrop-blur-md',
        card: 'bg-zinc-800/60 text-white border-white/20 shadow-lg'
    },
    '/tictactoe': {
        header: 'bg-gradient-to-r from-sky-600/70 via-sky-100/70 to-white/70 text-black backdrop-blur-md',
        footer: 'bg-gradient-to-r from-[#6b4b3a]/80 via-[#7a5a45]/80 to-[#8b6a55]/80 text-white backdrop-blur-md',
        card: 'bg-[#7a5a45]/70 text-white border-[#5a3f2d]/60 shadow-md'
    },


    '/': {
        header: 'bg-gradient-to-r from-indigo-900/80 via-blue-900/80 to-sky-900/80 text-white backdrop-blur-md',
        footer: 'bg-gradient-to-r from-indigo-900/80 via-blue-900/80 to-sky-900/80 text-white backdrop-blur-md',
        card: 'bg-sky-950/60 text-whiteborder-blue-800 shadow-lg'
    },

    '/user-mangement': {
        header: 'bg-gradient-to-r from-indigo-900/80 via-blue-900/80 to-sky-900/80 text-white backdrop-blur-md',
        footer: 'bg-gradient-to-r from-indigo-900/80 via-blue-900/80 to-sky-900/80 text-white backdrop-blur-md',
        card: 'bg-sky-950/60 text-white border-blue-800 shadow-lg'
    }
};


function setThemeByRoute(path: string) {
    const header = document.getElementById('header-root');
    const footer = document.getElementById('footer-root');
    if (!header || !footer) return;

    const theme = themeByRoute[path as RouteKey] || themeByRoute['/'];

    header.className = `shadow-lg p-8 ${theme.header}`;
    footer.className = `py-4 px-6 w-full ${theme.footer}`;
};


/**
 * Update background on route change in SPA navigation
 */
window.addEventListener('routeChange', (e: any) => {
    updateBackgroundByRoute(e.detail.path);
    setThemeByRoute(location.pathname);
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
    }
];

const router = new Router(routes);
