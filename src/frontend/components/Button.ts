import AbstractView from '../../utils/AbstractView.js';

export default class Button extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
	}

	async getHtml() {
		return this.render(`
			<a router class="btn" href="/">Button</a>
		`, {});
	}
}