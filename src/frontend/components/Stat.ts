import AbstractView from '../../utils/AbstractView.js';
import { StatProps } from '../../interfaces/componentInterfaces.js';

export default class Stat extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
	}

	async renderStat({ label, value, className = '' }: StatProps): Promise<string> {
		return this.render(`
			<div class="flex justify-between items-center w-full px-6 py-4 border-b border-white/10 ${className}">
				<div class="text-xl font-semibold text-gray-600">
					${label}:
				</div>
				<div class="text-2xl font-bold text-white break-words max-w-[60%] text-right">
					${value}
				</div>
			</div>
		`);
	}

	async getHtml(): Promise<string> {
		return this.render(`
			<div class="flex justify-between items-center w-full px-6 py-4 border-b border-white/10">
				<div class="text-xl font-semibold text-gray-600">Label:</div>
				<div class="text-2xl font-bold text-white text-right">42</div>
			</div>
		`);
	}
}
