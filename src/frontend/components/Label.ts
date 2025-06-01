import AbstractView from '../../utils/AbstractView.js';
import { LabelProps } from '../../interfaces/componentInterfaces.js';

export default class Label extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
	}

	async renderLabel({ htmlFor, text, className = '', id }: LabelProps): Promise<string> {
		const labelClass = className;

		return this.render(`
			<label for="${htmlFor}" ${id ? `id="${id}"` : ''} class="${labelClass}">
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
