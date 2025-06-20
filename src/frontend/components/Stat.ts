import AbstractView from '../../utils/AbstractView.js';
import { StatProps } from '../../interfaces/componentInterfaces.js';

export default class Stat extends AbstractView {
    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
    }

    async renderStat({ label, value, className = '' }: StatProps): Promise<string> {
        return this.render(`
			<div class="flex justify-between items-center w-full px-6 py-4 border-b border-white/10 ${className}">
				<div text-inherit font-semibold text-gray-600">
					${label}
				</div>
				<div text-inherit font-bold text-white break-words max-w-[60%] text-right">
					${value}
				</div>
			</div>
		`);
    }
    async getHtml(): Promise<string> {
        return this.render(`
			<div class="flex justify-between items-center w-full px-6 py-4 border-b border-white/10">
				<div text-inherit font-semibold text-gray-600">Label</div>
				<div text-inherit font-bold text-white text-right">42</div>
			</div>
		`);
    }
}
