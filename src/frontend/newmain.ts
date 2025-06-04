// ROUTES & SERVICES
import routes from './routeInit.js';
import './services/LanguageService.js';
import UserService from './services/UserService.js';
import UserManagementService from './services/UserManagementService.js';
import LobbyListService from './services/LobbyListService.js';
import LobbyService from './services/LobbyService.js';
import TournamentListService from './services/TournamentListService.js';
// import TournamentService from './services/TournamentService.js';
import MessageHandlerService from './services/MessageHandlerService.js';

// GLOBAL UTILS
import '../utils/TemplateEngine.js';
import Router from '../utils/Router.js';
import { TemplateEngine } from '../utils/TemplateEngine.js';

// UI COMPONENTS
import Card from './components/Card.js';
import Button from './components/Button.js';
import Footer from './components/Footer.js';
import Header from './components/Header.js';
import { LanguageService } from './services/LanguageService.js';

// GLOBAL TEMPLATE ENGINE
const globalTemplateEngine = new TemplateEngine();
globalTemplateEngine.registerComponent('Card', Card);
globalTemplateEngine.registerComponent('Button', Button);

//  GLOBAL SINGLETONS
window.userService = new UserService();
window.userManagementService = new UserManagementService();

// FOOTER + HEADER RENDERING
async function renderFooter(): Promise<void> {
    const footer = new Footer();
    const footerHtml = await footer.renderWithProps({
        year: '2025',
        links: [
            { text: 'Privacy', href: '/privacy' },
            { text: 'Terms', href: '/terms' },
            { text: 'Imprint', href: '/imprint' }
        ]
    });
    const footerElement = document.getElementById('footer-root');
    if (footerElement) {
        footerElement.innerHTML = footerHtml;
    }
}

async function renderHeader(): Promise<void> {
    const header = new Header(new URLSearchParams(window.location.search));
    const headerHtml = await header.getHtml();
    const headerElement = document.getElementById('header-root');
    if (headerElement) {
        headerElement.innerHTML = headerHtml;
    }
}

// APPLICATION STARTUP
async function initializeApplication(): Promise<void> {
    try {
        await ensureSocketConnection();

        LanguageService.setupLangSelect();
        console.log('WebSocket status:', window.ft_socket?.readyState);
    }
    catch (error) {
        console.error('Failed to initialize application:', error);
    }
}

async function ensureSocketConnection(): Promise<void> {
    if (!window.ft_socket || window.ft_socket.readyState !== WebSocket.OPEN) {
        await initializeSocket();
    }
    else {
        if (!window.messageHandler) {
            initializeGameServices();
        }
    }
}

// SOCKET INITIALIZATION
async function initializeSocket(): Promise<void> {
    try {
        const socket = await createWebSocketConnection();
        window.ft_socket = socket;

        // Initialize services after successful socket connection
        await initializeUserContext();
    }
    catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        throw error;
    }
}

function createWebSocketConnection(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${wsProtocol}//${window.location.host}/api/game/wss`);

        const onOpen = () => {
            cleanup();
            resolve(socket);
        };

        const onError = (event: Event) => {
            cleanup();
            console.error('WebSocket connection error:', event);
            reject(new Error('WebSocket connection failed'));
        };

        const cleanup = () => {
            socket.removeEventListener('open', onOpen);
            socket.removeEventListener('error', onError);
        };

        if (socket.readyState === WebSocket.OPEN) {
            resolve(socket);
        }
        else {
            socket.addEventListener('open', onOpen, { once: true });
            socket.addEventListener('error', onError, { once: true });
        }
    });
}

// USER CONTEXT MANAGEMENT
async function initializeUserContext(): Promise<void> {
    const currentUser = await UserService.getCurrentUser();
    window.currentUser = currentUser;

    if (!currentUser) {
        console.log('No user logged in, cleaning up services');
        destroyGameServices();
        closeWebSocketConnection();
        return;
    }
    initializeGameServices();

    console.log('User authenticated:', currentUser);
}

function closeWebSocketConnection(): void {
    if (window.ft_socket) {
        if (window.ft_socket.readyState === WebSocket.OPEN ||
            window.ft_socket.readyState === WebSocket.CONNECTING) {
            window.ft_socket.close(1000, 'User logged out');
        }
        // delete window.ft_socket;
    }
}

function initializeGameServices(): void {
    window.messageHandler = new MessageHandlerService();
    window.lobbyListService = new LobbyListService();
    window.lobbyService = new LobbyService();
    window.tournamentListService = new TournamentListService();
    // window.tournamentService = new TournamentService();
}

function destroyGameServices(): void {
    if (window.lobbyListService?.destroy) {
        window.lobbyListService.destroy();
        delete window.lobbyListService;
    }

    if (window.lobbyService?.destroy) {
        window.lobbyService.destroy();
        delete window.lobbyService;
    }

    if (window.tournamentListService?.destroy) {
        window.tournamentListService.destroy();
        delete window.tournamentListService;
    }

    // if (window.tournamentService?.destroy) {
    //     window.tournamentService.destroy();
    //     delete window.tournamentService;
    // }

    // if (window.messageHandler?.destroy) {
    //     window.messageHandler.destroy();
    //     delete window.messageHandler;
    // }
}

// ROUTER INSTANCE
const router = new Router(routes);
(window as any).router = router;

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        renderHeader(),
        renderFooter()
    ]);

    await initializeApplication();
    await router.render()
});

document.addEventListener('RouterContentLoaded', async () => {
    await initializeApplication();
    LanguageService.setupLangSelect();
    if (window.tournamentListService) {
        window.tournamentListService.setupEventListeners()
        window.userManagementService.setupEventListeners();
        window.userManagementService.twoFactorNumberActions();
        window.userManagementService.setupUserManagementView();
        window.userManagementService.initializeGoogleScript();
    }
});

// GOOGLE LOGIN HANDLER
(window as any).handleGoogleLogin = async function (response: any) {
    try {
        await window.userManagementService.loginWithGoogle(response.credential);
        await initializeUserContext();
    }
    catch (error) {
        console.error('Google login failed:', error);
        throw error;
    }
};
