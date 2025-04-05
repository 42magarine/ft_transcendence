import Router from '../utils/Router.js';
import Wurst from './views/Wurst.js';
import Bier from './views/Bier.js';

const routes = [
	{
		path: '/',
		view: Wurst,
		metadata: {
			title: 'Transcendence - Wurst',
			description: 'Welcome to Transcendence - the ultimate gaming experience'
		}
	},
	{
		path: '/bier',
		view: Bier,
		metadata: {
			title: 'Transcendence - Bier',
			description: 'Welcome to Bier - the ultimate drinking experience'
		}
	}
];

const router = new Router(routes);

document.addEventListener('DOMContentLoaded', () => {
	console.log("DOMContentLoaded")
	router.render();
});