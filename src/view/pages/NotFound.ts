// view/pages/NotFound.ts
import AbstractView from '../AbstractView.js';

export default class NotFound extends AbstractView {
	constructor(params?: URLSearchParams) {
		super(params);
		this.setTitle('404 Not Found | Transcendence');
	}

	async getHtml(): Promise<string> {
		return `
			<div class="not-found-container">
				<h1>404</h1>
				<h2>Page Not Found</h2>
				<p>The page you are looking for doesn't exist or has been moved.</p>
				<a href="/" data-link class="btn btn-primary">Back to Home</a>
			</div>
		`;
	}
}