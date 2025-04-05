// view/router.ts
import Home from './pages/Home.js';
import Game from './pages/Game.js';
import NotFound from './pages/NotFound.js';
import AbstractView from './AbstractView.js';

interface Route {
	path: string | RegExp;
	view: new () => AbstractView;
}

export default class Router {
	private routes: Route[] = [
		{ path: '/', view: Home },
		{ path: '/game', view: Game },
		// Add more routes as needed
	];

	private currentView: AbstractView | null = null;

	constructor() {
		this.initEventListeners();
	}

	private initEventListeners(): void {
		// Handle navigation via links with data-link attribute
		document.addEventListener('click', (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const link = target.closest('a');

			if (link && link.hasAttribute('data-link')) {
				e.preventDefault();
				const href = link.getAttribute('href') || '/';
				this.navigateTo(href);
			}
		});

		// Handle browser back/forward buttons
		window.addEventListener('popstate', () => {
			this.render();
		});
	}

	public async navigateTo(url: string): Promise<void> {
		window.history.pushState(null, '', url);
		await this.render();
	}

	public async render(): Promise<void> {
		// Find matching route
		const potentialMatches = this.routes.map(route => {
			return {
				route: route,
				isMatch: typeof route.path === 'string'
					? route.path === location.pathname
					: location.pathname.match(route.path)
			};
		});

		let match = potentialMatches.find(match => match.isMatch);

		// Default to 404 if no match found
		if (!match) {
			match = {
				route: { path: '/not-found', view: NotFound },
				isMatch: true
			};
		}

		// Create view instance
		const view = new match.route.view();

		// Clear current view if exists
		if (this.currentView) {
			this.currentView.destroy();
		}

		// Set and render new view
		this.currentView = view;

		// Get app element
		const appElement = document.getElementById('app');
		if (!appElement) return;

		// Render view content
		appElement.innerHTML = await view.getHtml();
		await view.afterRender();
	}
}