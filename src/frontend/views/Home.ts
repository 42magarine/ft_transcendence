import AbstractView from '../../utils/AbstractView.js';

export default class Home extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.setTitle('Transcendence - Home');
	}

	async getHtml() {
		return this.render(`
			<section class="hero bg-green-700">
				<h1>Welcome to Home</h1>
			</section>
		`, {});
	}
}