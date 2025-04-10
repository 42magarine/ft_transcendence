import AbstractView from '../../utils/AbstractView.js';

export default class Footer extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
	}

	async getHtml(): Promise<string> {
		return super.render(`
				<div class="flex flex-col md:flex-row justify-between items-center text-sm py-1 px-5 w-full">
					<p>&copy; {{props.year || '2025'}} Transcendence Project</p>
					<if condition="props.links">
						<nav class="flex gap-4 mt-2 md:mt-0">
							<for each="link in props.links" as="link">
								<a router href="{{link.href}}" class="hover:underline">
									{{link.text}}
								</a>
							</for>
						</nav>
					</if>
				</div>
		`);
	}
}
