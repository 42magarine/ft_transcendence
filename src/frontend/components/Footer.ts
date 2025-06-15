import AbstractView from '../../utils/AbstractView.js';

export default class Footer extends AbstractView {
	constructor(routeParams: Record<string,string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
    }

	async getHtml(): Promise<string> {
		return super.render(`
			<footer class="w-full py-1 px-5 text-inherit text-center">
				<div class="flex flex-col md:flex-row justify-between items-center text-inherit w-full">
					<p class="text-inherit">&copy; {{props.year || '2025'}} Transcendence Project</p>
					<if condition="props.links">
						<nav class="flex gap-4 mt-2 md:mt-0 text-inherit">
							<for each="props.links">
								<a router href="{{this.href}}" class="hover:underline text-inherit">
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
