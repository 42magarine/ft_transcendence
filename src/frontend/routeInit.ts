import Home from './views/Home.js';
import Pong from './views/Pong.js';
import LobbyList from './views/LobbyList.js';
import Lobby from './views/Lobby.js';
import Tournament from "./views/Tournament.js"
import Profile from './views/Profile.js';
import ProfileEdit from './views/ProfileEdit.js';
import UserMangement from './views/UserManagement.js';
import Login from './views/Login.js';
import Signup from './views/Signup.js';
import PasswordReset from './views/PasswordReset.js';
import TwoFactorLogin from './views/TwoFactorLogin.js';
import PongLocal from './views/PongLocal.js';
import Friends from './views/FriendList.js';
import TournamentWinner from './views/TournamentWinner.js';
import { Route, RouteHookContext } from '../interfaces/interfaces.js';
import TournamentTransition from './views/TournamentTransition.js';
import MatchHistory from './views/MatchHistory.js';
import GameOver from './views/GameOver.js';

const routes: Route[] = [
    {
        path: '/',
        view: Home,
        metadata: {
            title: 'Transcendence',
            description: 'Welcome to Transcendence - the ultimate gaming experience'
        }
    },
    {
        path: '/pong/:lobbyId/:matchId',
        role: 'user',
        view: Pong,
        metadata: {
            title: 'Transcendence - Pong',
            description: 'Welcome to Pong'
        },
        onLeave: async ({ route, params, view, path, from, to }: RouteHookContext): Promise<boolean | void> => {
            window.pongService.cleanup();
            return true;
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
        path: '/lobby/:id',
        role: 'user',
        view: Lobby,
        metadata: {
            title: 'Transcendence - Lobby',
            description: 'Welcome to Pong'
        },
        onLeave: async ({ route, params, view, path, from, to }: RouteHookContext): Promise<boolean | void> => {
            if (!to.includes('/pong/')) {
                window.messageHandler!.leaveLobby(params.id, false);
            }
            return true;
        }
    },
    {
        path: '/tournament/:id',
        role: 'user',
        view: Tournament,
        metadata: {
            title: 'Transcendence - Tournament',
            description: 'Welcome to Pong'
        },
        onLeave: async ({ route, params, view, path, from, to }: RouteHookContext): Promise<boolean | void> => {
            if (!to.includes('/pong/')) {
                window.messageHandler!.leaveLobby(params.id, false);
            }
            return true;
        }
    },
    {
        path: '/tournamenttransition',
        role: 'user',
        view: TournamentTransition,
        metadata: {
            title: 'Tournament Transition',
            description: 'Wait for next round to start'
        }
    },
    {
        path: '/tournamentwinner',
        role: 'user',
        view: TournamentWinner,
        metadata: {
            title: 'Tournament Winner',
            description: 'I guess someone actually won the tournament'
        }
    },
    {
        path: '/gameover',
        role: 'user',
        view: GameOver,
        metadata: {
            title: 'Game Over',
            description: 'I guess someone actually won the game'
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
        path: '/localpong',
        role: 'user_id',
        view: PongLocal,
        metadata: {
            title: 'Transcendence - Pong Local',
            description: 'Welcome to Local Pong'
        },
        onLeave: async ({ route, params, view, path, from, to }: RouteHookContext): Promise<boolean | void> => {
            window.localGameService.cleanup();
            return true;
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
    },
    {
        path: '/history',
        role: 'user_id',
        view: MatchHistory,
        metadata: {
            title: 'Transcendence - Match History',
            description: 'Overview of past matches'
        }
    }
];

export default routes;
