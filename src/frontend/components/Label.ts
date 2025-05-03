// ========================
// File: components/Label.ts
// ========================

import AbstractView from '../../utils/AbstractView.js';

interface LabelProps {
	htmlFor: string;
	text: string;
	className?: string;
}

export default class Label extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
	}

	async renderLabel({ htmlFor, text, className = '' }: LabelProps): Promise<string> {
		const labelClass = className

		return this.render(`
			<label for="${htmlFor}" class="${labelClass}">
				${text}
			</label>
		`);
	}

	async getHtml(): Promise<string> {
		return this.render(`
			<label for="default">
				Default Label
			</label>
		`);
	}
}
