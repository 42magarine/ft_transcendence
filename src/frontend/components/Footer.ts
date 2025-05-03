import AbstractView from '../../utils/AbstractView.js';

export default class Footer extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams(window.location.search)) {
		super(params);
	}

	async getHtml(): Promise<string> {
		return super.render(`
			<footer class="w-full py-1 px-5">
				<div class="flex flex-col md:flex-row justify-between items-center text-sm w-full">
					<p>&copy; {{props.year || '2025'}} Transcendence Project</p>
					<if condition="props.links">
						<nav class="flex gap-4 mt-2 md:mt-0">
							<for each="props.links">
								<a router href="{{this.href}}" class="hover:underline">
									{{this.text}}
								</a>
							</for>
						</nav>
					</if>
				</div>
			</footer>
		`);
	}
}
