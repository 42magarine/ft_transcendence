// ====================
// 🌐 ROUTES & SERVICES
// ====================
import routes from './routeInit.js';
import LobbyListService from './services/LobbyListService.js';
import LobbyService from './services/LobbyService.js';
import TournamentService from './services/TournamentService.js';
import MessageHandlerService from './services/MessageHandlerService.js';
import UserManagementService from './services/UserManagementService.js';
import UserService from './services/UserService.js';
import PongService from './services/PongService.js';

// ===============
// 🔧 GLOBAL UTILS
// ===============
import '../utils/TemplateEngine.js';
import Router from '../utils/Router.js';
import { TemplateEngine } from '../utils/TemplateEngine.js';

// =================
// 🧩 UI COMPONENTS
// =================
import Card from './components/Card.js';
import Button from './components/Button.js';
import Footer from './components/Footer.js';
import Header from './components/Header.js';
import { AccessibilityService } from './services/AccessibilityService.js';
import LanguageService from './services/LanguageService.js';

// =========================
// 🧠 GLOBAL TEMPLATE ENGINE
// =========================
const globalTemplateEngine = new TemplateEngine();
globalTemplateEngine.registerComponent('Card', Card);
globalTemplateEngine.registerComponent('Button', Button);

// =====================
// 🧩 GLOBAL SINGLETONS
// =====================
window.userService = new UserService();
window.ls = new LanguageService();
window.userManagementService = new UserManagementService();
window.handleModalOutsideClick = (event: Event, id: string) => {
    event.preventDefault();
    let modal = document.getElementById(id);
    modal?.remove();
}

// ==============================
// 📦 FOOTER + HEADER RENDERING
// ==============================
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
    if (footerElement)
        footerElement.innerHTML = footerHtml;
}

async function renderHeader(): Promise<void> {
    const header = new Header({}, new URLSearchParams(window.location.search));
    const headerHtml = await header.getHtml();
    const headerElement = document.getElementById('header-root');
    if (headerElement)
        headerElement.innerHTML = headerHtml;
}

// =======================
// 🌐 SOCKET INITIALIZATION
// =======================
function webSocketWrapper(socket: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
        if (socket.readyState === WebSocket.OPEN) {
            resolve();
        }
        else {
            socket.addEventListener('open', () => resolve(), { once: true });
            socket.addEventListener('error', (event) => {
                console.error('WebSocket error event:', event);
                reject(new Error('WebSocket connection failed'));
            },
                { once: true }
            );
        }
    });
}

async function initSocket(): Promise<void> {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${wsProtocol}//${window.location.host}/api/game/wss`);

    window.ft_socket = socket;

    socket.addEventListener('close', (event) => {
        // console.log("websocket closed", event.code, event.reason);
        setTimeout(() => socketUpdateOnSession(), 3000)
    })

    try {
        const readyPromise = webSocketWrapper(socket);
        window.socketReady = readyPromise;

        await readyPromise;

        window.messageHandler = new MessageHandlerService();
        window.lobbyListService = new LobbyListService();
        window.lobbyService = new LobbyService();
        window.tournamentService = new TournamentService();
        window.pongService = new PongService();

        if (window.ft_socket) {
            window.ft_socket.addEventListener('message', function (messageEvent) {
                window.lobbyListService.handleSocketMessage(messageEvent);
                window.lobbyService.handleSocketMessage(messageEvent);
                window.tournamentService.handleSocketMessage(messageEvent);
                window.pongService.handleSocketMessage(messageEvent);
                window.userService.handleSocketMessage(messageEvent);
            })
        }
    }
    catch (error) {
        console.error('WebSocket connection error:', error);
        throw error;
    }
}

async function socketUpdateOnSession() {
    const currentUser = await UserService.getCurrentUser();
    window.currentUser = currentUser;
    if (!currentUser) {
        if (window.ft_socket) {
            if (window.ft_socket.readyState === WebSocket.OPEN ||
                window.ft_socket.readyState === WebSocket.CONNECTING) {
                window.ft_socket.close(1000, 'User logged out');
            }
        }
        return;
    }

    if (!window.ft_socket || window.ft_socket.readyState !== WebSocket.OPEN) {
        initSocket();
        try {
            await window.socketReady;
        }
        catch (error) {
            console.error("RouterContentLoaded: Failed to initialize socket via initSocket():", error);
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await socketUpdateOnSession();
    await renderHeader();
    await renderFooter();
    await router.render();
});

document.addEventListener('RouterContentLoaded', async () => {
    await socketUpdateOnSession();
    window.ls.initialize();
    window.userManagementService.setupEventListeners();
    window.userManagementService.twoFactorNumberActions();
    window.userManagementService.setupUserManagementView();
    window.userManagementService.initializeGoogleScript();
    AccessibilityService.initialize();
});

// =======================
// 🧭 ROUTER INSTANCE
// =======================
const router = new Router(routes);
(window as any).router = router;

// ============================
// 🔐 GOOGLE LOGIN HANDLER
// ============================
(window as any).handleGoogleLogin = async function (response: any) {
    try {
        await window.userManagementService.loginWithGoogle(response.credential);
    }
    catch (error) {
        console.error('Google login failed:', error);
        throw error;
    }
};
