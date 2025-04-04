import './styles/main.css';
import Router from './router';

document.addEventListener('DOMContentLoaded', () => {
	const app = document.getElementById('app');
	if (!app) return;

	const router = new Router(app);

	document.addEventListener('click', (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		const link = target.closest('a');

		if (link && link.hasAttribute('data-link')) {
			e.preventDefault();
			const href = link.getAttribute('href') || '/';
			window.history.pushState({}, '', href);
			router.route();
		}
	});

	window.addEventListener('popstate', () => {
		router.route();
	});

	router.route();
});