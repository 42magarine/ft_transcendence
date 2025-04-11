import AbstractView from '../../utils/AbstractView.js';

export default class Header extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
	}

	async getHtml(): Promise<string> {
		return super.render(`
<div class="flex justify-between items-center">
	<h1 class="text-2xl font-bold whitespace-nowrap">
		<a router href="/" class="hover:underline">Transcendence</a>
	</h1>
	<div class="flex gap-2">
		<a router href="/" class="btn btn-secondary btn-theme-home">Home</a>
		<a router href="/user-mangement" class="btn btn-secondary btn-theme-user">User Management</a>
	</div>
</div>

	`);

	}
}
