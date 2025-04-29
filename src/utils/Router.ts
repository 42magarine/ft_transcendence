import { Route } from "./types.js";
import AbstractView from "./AbstractView.js"
import Header from '../frontend/components/Header.js';
import Footer from '../frontend/components/Footer.js';


export default class Router {
	private routes: Route[] = [];
	private currentView: AbstractView | null = null;

	constructor(routes: Route[]) {
		this.routes = routes;
		this.initEventListeners();
	}

	private initEventListeners(): void {
		document.addEventListener('click', (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const link = target.closest('a');

			if (link && link.hasAttribute('router')) {
				e.preventDefault();
				const href = link.getAttribute('href') || '/';
				this.navigateTo(href);
			}
		});

		window.addEventListener('popstate', () => {
			this.render();
		});
	}

	public async navigateTo(url: string): Promise<void> {
		window.history.pushState(null, '', url);
		await this.render();

		// Dispatch routeChange so background/theme can update
		const routeChangeEvent = new CustomEvent('routeChange', {
			detail: { path: url }
		});
		window.dispatchEvent(routeChangeEvent);
	}


	public async render(): Promise<void> {
		const potentialMatches = this.routes.map(route => {
			return {
				route: route,
				isMatch: typeof route.path === 'string'
					? route.path === location.pathname
					: location.pathname.match(route.path)
			};
		});

		let match = potentialMatches.find(match => match.isMatch);

		if (!match) {
			const notFoundRoute = this.routes.find(route => route.path === '/not-found' || route.path === '*');

			if (notFoundRoute) {
				match = {
					route: notFoundRoute,
					isMatch: true
				};
			} else {
				const appElement = document.getElementById('app');
				if (appElement) {
					appElement.innerHTML = '<h1>404 - Page Not Found</h1>';
				}
				return;
			}
		}

		const params = new URLSearchParams(window.location.search);
		const view = new match.route.view(params);

		// Get theme from view (e.g., 'stars', 'mechazilla')
		const theme = typeof view.getTheme === 'function' ? view.getTheme() : 'default';
		const themeParams = new URLSearchParams({ theme });

		// 🔥 Inject header and footer with the correct theme
		const headerHtml = await new Header(themeParams).getHtml();
		document.getElementById('header-root')!.innerHTML = headerHtml;

		const footerHtml = await new Footer(themeParams).getHtml();
		document.getElementById('footer-root')!.innerHTML = footerHtml;

		// Apply metadata if available
		if (match.route.metadata) {
			if (match.route.metadata.title) {
				view.setTitle(match.route.metadata.title);
			}
			if (match.route.metadata.description) {
				view.setDescription(match.route.metadata.description);
			}
		}

		if (this.currentView) {
			this.currentView.destroy();
		}

		this.currentView = view;

		const appElement = document.getElementById('app');
		if (!appElement) return;

		appElement.innerHTML = await view.getHtml();
		await view.afterRender();
	}

}