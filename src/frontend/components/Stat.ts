import AbstractView from '../../utils/AbstractView.js';
import { StatProps } from '../../interfaces/abstractViewInterfaces.js';

export default class Stat extends AbstractView {
    constructor(params: URLSearchParams = new URLSearchParams()) {
        super(params);
    }

    async renderStat({ label, value, className = '' }: StatProps): Promise<string> {
        return this.render(`
      <div class="text-center p-4 rounded-lg shadow-md ${className}">
        <div class="text-lg font-semibold">${label}</div>
        <div class="text-3xl font-bold mt-1">${value}</div>
      </div>
    `);
    }

    async getHtml(): Promise<string> {
        return this.render(`
      <div class="text-center p-4 rounded-lg shadow-md">
        <div class="text-lg font-semibold">Label</div>
        <div class="text-3xl font-bold mt-1">42</div>
      </div>
    `);
    }
}
