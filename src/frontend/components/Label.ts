// ========================
// File: components/Label.ts
// ========================

import AbstractView from '../../utils/AbstractView.js';
import { themedLabel } from '../theme/themeHelpers.js';

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
		const theme = this.props?.theme || 'default';
		const labelClass = className || themedLabel(theme);

		return this.render(`
			<label for="${htmlFor}" class="${labelClass}">
				${text}
			</label>
		`);
	}

	async getHtml(): Promise<string> {
		const theme = this.props?.theme || 'default';
		const labelClass = themedLabel(theme);

		return this.render(`
			<label for="default" class="${labelClass}">
				Default Label
			</label>
		`);
	}
}
