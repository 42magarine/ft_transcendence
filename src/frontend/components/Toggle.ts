// ========================
// File: components/Toggle.ts
// ========================

import AbstractView from '../../utils/AbstractView.js';
import { themedToggle, themedToggleLabel } from '../theme/themeHelpers.js';

interface ToggleProps {
	id: string;
	label: string;
	checked?: boolean;
}

export default class Toggle extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
	}

	async renderToggle({ id, label, checked = false }: ToggleProps): Promise<string> {
		const theme = this.props?.theme || 'default';
		const trackClass = themedToggle(theme);
		const labelClass = themedToggleLabel(theme);

		return this.render(`
			<label for="${id}" class="flex items-center gap-3 cursor-pointer">
				<input
					type="checkbox"
					id="${id}"
					${checked ? 'checked' : ''}
					class="toggle-checkbox hidden"
				/>
				<span class="w-12 h-6 ${trackClass} rounded-full flex items-center px-1 transition-colors duration-300 toggle-track">
					<span class="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 toggle-thumb"></span>
				</span>
				<span class="${labelClass}">${label}</span>
			</label>
		`);
	}

	async getHtml(): Promise<string> {
		const theme = this.props?.theme || 'default';
		const trackClass = themedToggle(theme);
		const labelClass = themedToggleLabel(theme);

		return this.render(`
			<label class="flex items-center gap-3 cursor-pointer">
				<input type="checkbox" class="toggle-checkbox hidden" />
				<span class="w-12 h-6 ${trackClass} rounded-full flex items-center px-1">
					<span class="w-4 h-4 bg-white rounded-full shadow-md"></span>
				</span>
				<span class="${labelClass}">Default toggle</span>
			</label>
		`);
	}
}
