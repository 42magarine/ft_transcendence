import AbstractView from '../../utils/AbstractView.js';
import { LabelProps } from '../../interfaces/componentInterfaces.js';

export default class Label extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
	}

	async renderLabel({
		htmlFor,
		text = '',
		className = '',
		id,
		iconHtml = '',
		color
	}: LabelProps): Promise<string> {
		const labelClass = `mt-2 ${className}`.trim();
	
		let [labelText, valueText] = text.split(':');
		valueText = valueText?.trim() ?? '';
	
		const hasText = labelText?.trim() !== '';
	
		const colorClassMap: Record<string, string> = {
			green: 'text-green-500',
			red: 'text-red-500',
			yellow: 'text-yellow-500',
			gray: 'text-gray-500',
			blue: 'text-blue-500',
			black: 'text-black',
			white: 'text-white',
		};
	
		const icon = iconHtml
			? `<i class="fas ${iconHtml} ${color && colorClassMap[color] ? colorClassMap[color] : ''}"></i> `
			: '';
	
		return this.render(`
			<div class="flex flex-row items-center gap-4 ${labelClass}" ${id ? `id="${id}"` : ''}>
				<label for="${htmlFor}" class="text-sm text-gray-400 font-medium">
					${icon}${hasText ? labelText : ''}
				</label>
				${hasText ? `<span class="text-base text-white">${valueText}</span>` : ''}
			</div>
		`);
	}	

	async getHtml(): Promise<string> {
		return this.render(`
			<div class="flex flex-row items-center gap-4 mt-2">
				<label for="default" class="text-sm text-gray-400 font-medium">Label:</label>
				<span class="text-base text-white">Value</span>
			</div>
		`);
	}
}
