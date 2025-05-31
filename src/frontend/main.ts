// ====================
// 🌐 ROUTES & SERVICES
// ====================
import routes from './route_init.js';
import './services/LanguageService.js';
import LobbyListService from './services/LobbyListService.js';
import LobbyService from './services/LobbyService.js';
import MessageHandlerService from './services/MessageHandlerService.js';
import UserMangementService from './services/UserManagementService.js';
import UserService from './services/UserService.js';

// ===============
// 🔧 GLOBAL UTILS
// ===============
import '../utils/table.js';
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
window.userManagementService = new UserMangementService();

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
	const header = new Header(new URLSearchParams(window.location.search));
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
		} else {
			socket.addEventListener('open', () => resolve(), { once: true });
			socket.addEventListener('error', (event) => {
				console.error('WebSocket error event:', event);
				reject(new Error('WebSocket connection failed'));
			}, { once: true });
		}
	});
}

function initSocket(): void {
	const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	const socket = new WebSocket(`${wsProtocol}//${window.location.host}/api/game/wss`);

	window.ft_socket = socket;

	window.socketReady = webSocketWrapper(socket)
		.then(() => {
			window.lobbyListService = new LobbyListService();
			window.lobbyService = new LobbyService();
			window.messageHandler = new (MessageHandlerService as any)(
				socket,
				window.socketReady,
				window.userService
			);

			window.lobbyListService?.init();
            if (window.messageHandler) {
                window.lobbyService.init(socket, window.messageHandler, window.userService);
            }
    
		})
		.catch((err) => {
			console.error('WebSocket connection error:', err);
			throw err;
		});
}

// =======================
// ⚡ ROUTER EVENT HANDLING
// =======================

document.addEventListener('RouterContentLoaded', async () => {
	const currentUser = await UserService.getCurrentUser();

	if (!currentUser) {
		console.log("No user found, ensuring socket is closed.");
		if (window.ft_socket?.readyState === WebSocket.OPEN ||
			window.ft_socket?.readyState === WebSocket.CONNECTING) {
			window.ft_socket.close(1000, 'User logged out');
		}
		window.lobbyListService?.destroy?.();
		window.ft_socket = undefined;
		window.socketReady = undefined;
		window.messageHandler = undefined;
		window.lobbyService = undefined;
		return;
	}

	if (!window.ft_socket || window.ft_socket.readyState !== WebSocket.OPEN) {
		initSocket();
		try {
			await window.socketReady;
		} catch (error) {
			console.error("RouterContentLoaded: Failed to initialize socket via initSocket():", error);
		}
	} else if (!window.messageHandler) {
		window.lobbyListService = window.lobbyListService || new LobbyListService();
		window.lobbyService = window.lobbyService || new LobbyService();
		window.messageHandler = new MessageHandlerService();

		window.lobbyListService.init();
		window.lobbyService?.init(window.ft_socket, window.messageHandler, window.userService);
	} else {
		window.lobbyListService?.init();
	}
});

// =======================
// 🧭 ROUTER INSTANCE
// =======================

const router = new Router(routes);
(window as any).router = router;

// =======================
// 🚀 DOM RENDER ON LOAD
// =======================

document.addEventListener('DOMContentLoaded', async () => {
	await renderHeader();
	await renderFooter();
	await router.render();
});

// ============================
// 🔐 GOOGLE LOGIN HANDLER
// ============================

(window as any).handleGoogleLogin = async function (response: any) {
	try {
		await window.userManagementService.loginWithGoogle(response.credential);
	} catch (error) {
		console.error('Google login failed:', error);
		throw error;
	}
};
