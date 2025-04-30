import { Route } from "./types.js";
import AbstractView from "./AbstractView.js"
import Header from '../frontend/components/Header.js';
import Footer from '../frontend/components/Footer.js';

export default class Router {
	private routes: Route[] = [];
	private currentView: AbstractView | null = null;
	private static instance: Router | null = null;

	constructor(routes: Route[]) {
		this.routes = routes;
		this.initEventListeners();

		if (!Router.instance) {
			Router.instance = this;
		}
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

		document.addEventListener('DataUpdateEvent', ((e: CustomEvent) => {
			this.renderCurrentView(e.detail);
		}) as EventListener);
	}

	public static triggerDataUpdate(detail: any = {}): void {
		const dataUpdateEvent = new CustomEvent('DataUpdateEvent', {
			bubbles: true,
			cancelable: true,
			detail
		});

		document.dispatchEvent(dataUpdateEvent);
		console.log('DataUpdateEvent ausgelöst:', detail);
	}

	public update(): void {
		this.renderCurrentView();
	}

	public static update(): void {
		if (Router.instance) {
			Router.instance.update();
		} else {
			const globalRouter = (window as any).router;
			if (globalRouter && typeof globalRouter.update === 'function') {
				globalRouter.update();
			} else {
				console.error('Router.update() wurde aufgerufen, aber es gibt keine aktive Router-Instanz');
			}
		}
	}

	private async renderCurrentView(eventDetail: any = {}): Promise<void> {
		if (!this.currentView) return;

		const appElement = document.getElementById('app');
		if (!appElement) return;

		appElement.classList.add('loading');

		try {
			appElement.innerHTML = await this.currentView.getHtml();
			await this.currentView.afterRender();

			this.dispatchRouterContentLoaded(true);
		} finally {
			appElement.classList.remove('loading');
		}
	}

	public async navigateTo(url: string): Promise<void> {
		window.history.pushState(null, '', url);
		await this.render();

		const routeChangeEvent = new CustomEvent('routeChange', {
			detail: { path: url }
		});
		window.dispatchEvent(routeChangeEvent);
	}

	/**
	 * Parse a route pattern and extract parameters from a URL
	 * @param pattern Route pattern like '/users/:id'
	 * @param path Actual URL path like '/users/123'
	 * @returns Object with parameters or null if no match
	 */
	private extractRouteParams(pattern: string, path: string): Record<string, string> | null {
		// Convert pattern to regex
		// Replace :paramName with a named capture group (?<paramName>[^/]+)
		const paramRegex = /:([^/]+)/g;
		const regexPattern = pattern.replace(paramRegex, (_, paramName) => `(?<${paramName}>[^/]+)`);

		// Create regex with exact matching
		const regex = new RegExp(`^${regexPattern}$`);

		// Test and extract parameters
		const match = path.match(regex);

		if (!match) {
			return null;
		}

		// Return the named groups (parameters)
		return match.groups || {};
	}

	/**
	 * Check if a route matches the current location
	 */
	private matchRoute(route: Route): { isMatch: boolean; params?: Record<string, string> } {
		const path = location.pathname;

		// Direct string match
		if (typeof route.path === 'string') {
			// Check for parameter pattern (contains ":")
			if (route.path.includes(':')) {
				const params = this.extractRouteParams(route.path, path);
				if (params !== null) {
					return {
						isMatch: true,
						params: params
					};
				} else {
					return {
						isMatch: false
					};
				}
			}

			// Simple direct match
			return {
				isMatch: route.path === path
			};
		}

		// Regex match
		const match = path.match(route.path);
		return {
			isMatch: match !== null,
			params: match ? match.groups || {} : undefined
		};
	}

	public async render(): Promise<void> {
		// Map routes to potential matches with params
		const potentialMatches = this.routes.map(route => {
			const matchResult = this.matchRoute(route);
			return {
				route: route,
				isMatch: matchResult.isMatch,
				params: matchResult.params || {}
			};
		});

		let match = potentialMatches.find(match => match.isMatch);

		if (!match) {
			const notFoundRoute = this.routes.find(route => route.path === '/not-found' || route.path === '*');

			if (notFoundRoute) {
				match = {
					route: notFoundRoute,
					isMatch: true,
					params: {}
				};
			} else {
				const appElement = document.getElementById('app');
				if (appElement) {
					appElement.innerHTML = '<h1>404 - Page Not Found</h1>';
				}
				return;
			}
		}

		// Get URL query parameters
		const queryParams = new URLSearchParams(window.location.search);

		// Create merged params object (route params + query params)
		const allParams = new URLSearchParams();

		// Add query params
		for (const [key, value] of queryParams.entries()) {
			allParams.append(key, value);
		}

		// Add route params
		for (const [key, value] of Object.entries(match.params)) {
			allParams.append(key, value);
		}

		// Create view with all parameters
		const view = new match.route.view(allParams);

		const theme = typeof view.getTheme === 'function' ? view.getTheme() : 'default';
		const themeParams = new URLSearchParams({ theme });

		const headerHtml = await new Header(themeParams).getHtml();
		document.getElementById('header-root')!.innerHTML = headerHtml;

		const footerHtml = await new Footer(themeParams).getHtml();
		document.getElementById('footer-root')!.innerHTML = footerHtml;

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

		this.dispatchRouterContentLoaded();
	}

	private dispatchRouterContentLoaded(isDataUpdate: boolean = false): void {
		const RouterContentLoadedEvent = new CustomEvent('RouterContentLoaded', {
			bubbles: true,
			cancelable: true,
			detail: {
				view: this.currentView,
				path: location.pathname,
				isDataUpdate
			}
		});

		document.dispatchEvent(RouterContentLoadedEvent);
	}
}