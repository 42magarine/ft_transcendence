import AbstractView from '../../utils/AbstractView.js';
import { StatProps } from '../../interfaces/componentInterfaces.js';

export default class Stat extends AbstractView {
    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
    }

    async renderStat({ label, value, checkbox = false, className = '' }: StatProps): Promise<string> {
		// Handle checkbox display
		const displayValue = checkbox
			? `<div class="w-5 h-5 rounded border border-gray-400 flex items-center justify-center 
						${value === 'true' ? 'bg-green-500' : 'bg-white'}">
					${value === 'true' ? '<div class="w-2 h-2 bg-white rounded-full"></div>' : ''}
			   </div>`
			: `<div class="text-inherit font-bold text-white break-words max-w-[60%] text-right">
					${value ?? ''}
			   </div>`;
	
		return this.render(`
			<div class="flex justify-between items-center w-full px-6 py-4 border-b border-white/10 ${className}">
				<div class="text-inherit font-semibold text-gray-600">
					${label}
				</div>
				${displayValue}
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
