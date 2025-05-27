declare global {
    interface Window {
        ft_socket?: WebSocket;
        socketReady?: Promise<void>;
        messageHandler?: MessageHandlerService;
        lobbyListService?: LobbyListService;
        lobbyService?: LobbyService;
        userService: UserService;
        userManagementService: UserMangementService;
    }
}

// services
import './services/LanguageService.js';

// utils
import '../utils/table.js';
import '../utils/TemplateEngine.js';
import Router from '../utils/Router.js';
import { TemplateEngine } from '../utils/TemplateEngine.js';
import MessageHandlerService from './services/MessageHandlerService.js';
import UserMangementService from './services/UserManagementService.js';
import UserService from './services/UserService.js';

// views
import Home from './views/Home.js';
import Pong from './views/Pong.js';
import Lobby from './views/Lobby.js';
import Tournament from './views/Tournament.js';
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
import LobbyListService from './services/LobbyListService.js';
import LobbyService from './services/LobbyService.js';

const globalTemplateEngine = new TemplateEngine();
globalTemplateEngine.registerComponent('Card', Card);
globalTemplateEngine.registerComponent('Button', Button);

/**
 * Dynamically render the footer into <footer id="footer-root">
 */
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

/**
 * Dynamically render the header into <header id="header-root">
 */
async function renderHeader(): Promise<void> {
    const header = new Header(new URLSearchParams(window.location.search));
    const headerHtml = await header.getHtml();
    const headerElement = document.getElementById('header-root');
    if (headerElement) {
        headerElement.innerHTML = headerHtml;
    }
}

window.userService = new UserService();
window.userManagementService = new UserMangementService();

/**
 * Initial render and background setup on first load
 */
function initSocket(): void {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let socket = new WebSocket(`${wsProtocol}//${window.location.host}/api/game/wss`);

    window.ft_socket = socket;

    window.socketReady = webSocketWrapper(socket)
        .then(() => {
            window.lobbyListService = new LobbyListService();
            window.lobbyService = new LobbyService();
            window.messageHandler = new (MessageHandlerService as any)(socket, window.socketReady, window.userService);

            if (window.lobbyListService && window.socketReady) {
                window.lobbyListService.init();
            }
            if (window.lobbyService && window.messageHandler) {
                window.lobbyService.init(socket, window.messageHandler, window.userService);
            }
        })
        .catch((err) => {
            console.error('WebSocket connection error:', err);
            throw err;
        });
}

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

document.addEventListener('RouterContentLoaded', async () => {
    console.log("RouterContentLoaded event triggered.");
    const currentUser = await UserService.getCurrentUser();
    if (!currentUser) {
        console.log("No user found, ensuring socket is closed.");
        if (window.ft_socket) {
            if (window.ft_socket.readyState === WebSocket.OPEN ||
                window.ft_socket.readyState === WebSocket.CONNECTING) {
                window.ft_socket.close(1000, 'User logged out');
            }
            if (window.lobbyListService && typeof window.lobbyListService.destroy === 'function') {
                window.lobbyListService.destroy();
            }
            // if (window.lobbyService && typeof window.lobbyService.destroy === 'function') {
            //     window.lobbyService.destroy();
            // }
            window.ft_socket = undefined;
            window.socketReady = undefined;
            window.messageHandler = undefined;
            window.lobbyListService = undefined;
            window.lobbyService = undefined;
        }
        return;
    }

    if (!window.ft_socket || window.ft_socket.readyState !== WebSocket.OPEN) {
        console.warn("RouterContentLoaded: Socket not ready or not open. Calling initSocket().");
        initSocket();
        try {
            await window.socketReady;
            console.log("RouterContentLoaded: Socket and services initialized via initSocket().");
        } catch (error) {
            console.error("RouterContentLoaded: Failed to initialize socket via initSocket():", error);
        }
    } else {
        console.log("RouterContentLoaded: Socket is already ready.");
        if (!window.messageHandler) {
             window.lobbyListService = window.lobbyListService || new LobbyListService();
             window.lobbyService = window.lobbyService || new LobbyService();
             window.messageHandler = new MessageHandlerService();

             if (window.lobbyListService) window.lobbyListService.init();
             if (window.lobbyService && window.messageHandler) {
                 window.lobbyService.init(window.ft_socket, window.messageHandler, window.userService);
             }
        } else {
            if (window.lobbyListService) {
                console.log("RouterContentLoaded: Socket and messageHandler ready. Re-initializing LobbyListService UI components.");
                window.lobbyListService.init();
            }
            if (window.lobbyService) {
                 // lobbyService.init might also need to be called if it manages UI specific to its views.
                 // window.lobbyService.init(window.ft_socket, window.messageHandler, window.userService);
            }
        }
    }
});
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
        path: '/pong/:id',
        role: 'user',
        view: Pong,
        metadata: {
            title: 'Transcendence - Pong',
            description: 'Welcome to Pong'
        }
    },
    {
        path: '/lobby/:id',
        role: 'user',
        view: Lobby,
        metadata: {
            title: 'Transcendence - Lobby',
            description: 'Welcome to Pong'
        }
    },
    {
        path: '/tournament/:id',
        role: 'user',
        view: Tournament,
        metadata: {
            title: 'Transcendence - Tournament',
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


(window as any).handleGoogleLogin = async function (response: any) {
    try {
        await window.userManagementService.loginWithGoogle(response.credential);
    }
    catch (error) {
        console.error('Google login failed:', error);
        throw error;
    }
};
