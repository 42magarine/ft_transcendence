// ========================
// File: components/Stat.ts
// ========================
import AbstractView from '../../utils/AbstractView.js';
import { themedStat } from '../theme/themeHelpers.js';
export default class Stat extends AbstractView {
    constructor(params = new URLSearchParams()) {
        super(params);
    }
    async renderStat({ label, value, className = '' }) {
        const theme = this.props?.theme || 'default';
        const statClass = themedStat(theme);
        return this.render(`
      <div class="text-center p-4 rounded-lg shadow-md ${statClass} ${className}">
        <div class="text-lg font-semibold">${label}</div>
        <div class="text-3xl font-bold mt-1">${value}</div>
      </div>
    `);
    }
    async getHtml() {
        const theme = this.props?.theme || 'default';
        const statClass = themedStat(theme);
        return this.render(`
      <div class="text-center p-4 rounded-lg shadow-md ${statClass}">
        <div class="text-lg font-semibold">Label</div>
        <div class="text-3xl font-bold mt-1">42</div>
      </div>
    `);
    }
}
