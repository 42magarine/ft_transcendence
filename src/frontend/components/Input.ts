import AbstractView from '../../utils/AbstractView.js';
import { InputProps } from '../../interfaces/abstractViewInterfaces.js';

export default class Input extends AbstractView {
    constructor(params: URLSearchParams = new URLSearchParams()) {
        super(params);
    }

    async renderInput({
        id = '',
        name,
        type = 'text',
        placeholder = '',
        value = '',
        className = ''
    }: InputProps): Promise<string> {
        const finalClass = className

        return this.render(`
      <input
        type="${type}"
        id="${id}"
        name="${name}"
        placeholder="${placeholder}"
        value="${value}"
        class="${finalClass}"
        required
      />
    `);
    }

    async getHtml(): Promise<string> {

        return this.render(`<input placeholder="Default Input" />`);
    }
}
