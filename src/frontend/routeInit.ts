
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
import TwoFactorLogin from './views/TwoFactorLogin.js';
import LobbyList from './views/LobbyList.js';
import PongLocal from './views/PongLocal.js';
import Friends from './views/FriendList.js';

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
        path: '/password-reset/:token',
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
    },
    {
        path: '/localpong',
        role: 'user_id',
        view: PongLocal,
        metadata: {
            title: 'Transcendence - Pong Local',
            description: 'Welcome to Local Pong'
        }
    },
    {
        path: '/friends',
        role: 'user_id',
        view: Friends,
        metadata: {
            title: 'Transcendence - Friends',
            description: 'Manage your friends and connections'
        }
    }
];

export default routes;