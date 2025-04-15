// ========================
// File: components/Label.ts
// ========================
import AbstractView from '../../utils/AbstractView.js';
import { themedLabel } from '../theme/themeHelpers.js';
export default class Label extends AbstractView {
    constructor(params = new URLSearchParams()) {
        super(params);
    }
    async renderLabel({ htmlFor, text, className = '' }) {
        const theme = this.props?.theme || 'default';
        const labelClass = className || themedLabel(theme);
        return this.render(`
			<label for="${htmlFor}" class="${labelClass}">
				${text}
			</label>
		`);
    }
    async getHtml() {
        const theme = this.props?.theme || 'default';
        const labelClass = themedLabel(theme);
        return this.render(`
			<label for="default" class="${labelClass}">
				Default Label
			</label>
		`);
    }
}
