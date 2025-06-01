import AbstractView from '../../utils/AbstractView.js';
import { LabelProps } from '../../interfaces/componentInterfaces.js';

export default class Label extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
	}

	async renderLabel({ htmlFor, text, className = '', id }: LabelProps): Promise<string> {
		const labelClass = `mt-2 ${className}`.trim();

		// If value is embedded in text (e.g. "Email: user@example.com"), split it
		let [labelText, valueText] = text.split(':');
		valueText = valueText?.trim() ?? '';

		return this.render(`
			<div class="flex flex-row items-center gap-4 ${labelClass}" ${id ? `id="${id}"` : ''}>
				<label for="${htmlFor}" class="text-sm text-gray-400 font-medium">
					${labelText}:
				</label>
				<span class="text-base text-white">${valueText}</span>
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
