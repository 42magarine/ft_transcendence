import AbstractView from '../../utils/AbstractView.js';
import { LabelProps } from '../../interfaces/componentInterfaces.js';

export default class Label extends AbstractView {
    constructor(routeParams: Record<string,string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
    }

    async renderLabel({ htmlFor, text, className = '', id }: LabelProps): Promise<string> {
        const labelClass = `mt-2 ${className}`.trim(); // Add margin-top spacing

        return this.render(`
			<label for="${htmlFor}" ${id ? `id="${id}"` : ''} class="${labelClass}">
				${text}
			</label>
		`);
    }

    async getHtml(): Promise<string> {
        return this.render(`
			<label for="default" class="mt-2">
				Default Label
			</label>
		`);
    }
}
