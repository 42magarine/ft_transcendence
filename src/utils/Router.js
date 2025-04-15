export default class Router {
    routes = [];
    currentView = null;
    constructor(routes) {
        this.routes = routes;
        this.initEventListeners();
    }
    initEventListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target;
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
    async navigateTo(url) {
        window.history.pushState(null, '', url);
        await this.render();
        // Dispatch routeChange so background/theme can update
        const routeChangeEvent = new CustomEvent('routeChange', {
            detail: { path: url }
        });
        window.dispatchEvent(routeChangeEvent);
    }
    async render() {
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
            }
            else {
                // Default 404 handler if no route defined
                const appElement = document.getElementById('app');
                if (appElement) {
                    appElement.innerHTML = '<h1>404 - Page Not Found</h1>';
                }
                return;
            }
        }
        console.log("Router render " + match.route.path);
        const params = new URLSearchParams(window.location.search);
        const view = new match.route.view(params);
        console.log("View is " + view);
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
        if (!appElement)
            return;
        appElement.innerHTML = await view.getHtml();
        await view.afterRender();
    }
    getCurrentView() {
        return this.currentView;
    }
}
