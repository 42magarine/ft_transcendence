import './utils/TemplateEngine.js';
import Router from '../utils/router.js';
import Home from './views/Home.js';
import Pong from './views/Pong.js';
import TicTacToe from './views/TicTacToe.js';

import { TemplateEngine } from '../utils/TemplateEngine.js';
import Card from './components/Card.js';
import Button from './components/Button.js';

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
		path: '/tictactoe',
		view: TicTacToe,
		metadata: {
			title: 'Transcendence - TicTacToe',
			description: 'Welcome to TicTacToe'
		}
	}
];

const router = new Router(routes);

document.addEventListener('DOMContentLoaded', () => {
	router.render();
});