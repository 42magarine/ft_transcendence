import { Route } from "./types.js";
import AbstractView from "./AbstractView.js";
import Header from '../frontend/components/Header.js';
import Footer from '../frontend/components/Footer.js';

// Define a User interface for type safety
interface User {
    id: string;
    username: string;
    role: string; // Using string type to allow any role value
    // Add other user properties as needed
}

export default class Router {
    private routes: Route[] = [];
    private currentView: AbstractView | null = null;
    private static instance: Router | null = null;
    // Define the role hierarchy - higher index means more privileges
    private static ROLE_HIERARCHY = ['user', 'admin', 'master'];

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
                console.error('Router.update() was called, but there is no active Router instance');
            }
        }
    }

    /**
     * Redirects to a specified URL
     * Can be called from anywhere, including views
     * @param url The URL to redirect to
     * @param options Optional configuration options
     */
    public redirect(url: string, options: { replace?: boolean } = {}): Promise<void> {
        // Replace state instead of pushing if specified
        if (options.replace) {
            window.history.replaceState(null, '', url);
        } else {
            window.history.pushState(null, '', url);
        }

        return this.render();
    }

    /**
     * Static method to redirect from anywhere in the application
     * @param url The URL to redirect to
     * @param options Optional configuration options
     */
    public static redirect(url: string, options: { replace?: boolean } = {}): Promise<void> {
        if (Router.instance) {
            return Router.instance.redirect(url, options);
        } else {
            const globalRouter = (window as any).router;
            if (globalRouter && typeof globalRouter.redirect === 'function') {
                return globalRouter.redirect(url, options);
            } else {
                console.error('Router.redirect() was called, but there is no active Router instance');
                return Promise.resolve();
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

    /**
     * Helper method to check if a user has sufficient role privileges
     * 'master' > 'admin' > 'user'
     */
    private hasRoleAccess(requiredRole: string, userRole: string): boolean {
        if (!requiredRole) return true; // No role required
        if (!userRole) return false; // No user role but role required

        // Special roles like 'user_id' and 'logged_out' should be handled separately
        if (requiredRole === 'user_id' || requiredRole === 'logged_out') {
            return false; // These are handled specifically in the render method
        }

        // Direct match
        if (requiredRole === userRole) return true;

        // Check hierarchy: master > admin > user
        const userRoleIndex = Router.ROLE_HIERARCHY.indexOf(userRole);
        const requiredRoleIndex = Router.ROLE_HIERARCHY.indexOf(requiredRole);

        // Higher roles can access lower role routes
        // A valid userRoleIndex will be >= 0 and a valid requiredRoleIndex will be >= 0
        // Higher roles have higher indices in our ROLE_HIERARCHY array
        const hasAccess = userRoleIndex >= 0 && requiredRoleIndex >= 0 && userRoleIndex > requiredRoleIndex;

        return hasAccess;
    }

    /**
     * Get current user from API
     */
    private static async getCurrentUser(): Promise<User | null> {
        try {
            const response = await fetch('/api/auth/me');
            if (response.status === 401) {
                return null;
            }

            return await response.json() as User;
        } catch (error) {
            console.error('Failed to fetch current user:', error);
            return null;
        }
    }

    public async render(): Promise<void> {
        // Get current user for role checking
        const currentUser = await Router.getCurrentUser();

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

        // Handle role-based access control
        if (match.route.role) {
            // Special case: logged_out routes should only be accessible when not logged in
            if (match.route.role === 'logged_out') {
                if (currentUser) {
                    return this.redirect('/', { replace: true });
                }
            }
            // Special case: user_id routes should only be accessible by the specific user
            else if (match.route.role === 'user_id') {
                const routeUserId = match.params.id;
                if (!currentUser) {
                    return this.redirect('/login', { replace: true });
                } else if (currentUser.role == "user" && routeUserId && String(currentUser.id) !== String(routeUserId)) {
                    return this.redirect('/', { replace: true });
                }
            }
            // Standard role check (user, admin, master)
            else if (!currentUser) {
                return this.redirect('/login', { replace: true });
            }
            else if (!this.hasRoleAccess(match.route.role, currentUser.role)) {
                return this.redirect('/', { replace: true });
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

        const headerHtml = await new Header().getHtml();
        document.getElementById('header-root')!.innerHTML = headerHtml;

        const footerHtml = await new Footer().getHtml();
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
        await view.mount();

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
