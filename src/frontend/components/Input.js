// ========================
// File: components/Input.ts
// ========================
import AbstractView from '../../utils/AbstractView.js';
import { themedInput } from '../theme/themeHelpers.js';
export default class Input extends AbstractView {
    constructor(params = new URLSearchParams()) {
        super(params);
    }
    async renderInput({ name, type = 'text', placeholder = '', value = '', className = '' }) {
        const theme = this.props?.theme || 'default';
        const finalClass = className || themedInput(theme);
        return this.render(`
      <input
        type="${type}"
        name="${name}"
        placeholder="${placeholder}"
        value="${value}"
        class="${finalClass}"
        required
      />
    `);
    }
    async getHtml() {
        const theme = this.props?.theme || 'default';
        const finalClass = themedInput(theme);
        return this.render(`<input class="${finalClass}" placeholder="Default Input" />`);
    }
}
