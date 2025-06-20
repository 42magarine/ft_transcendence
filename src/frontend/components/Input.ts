import AbstractView from '../../utils/AbstractView.js';
import { InputProps } from '../../interfaces/componentInterfaces.js';

export default class Input extends AbstractView {
    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
    }

    async renderInput({
        id = '',
        name,
        type = 'text',
        placeholder = '',
        value = '',
        className = '',
        withConfirm = false,
        bare = false,
        label,
    }: InputProps & { withConfirm?: boolean; bare?: boolean }): Promise<string> {
        const finalClass = className || 'input';

        let inputField = '';

        if (type === 'select') {
            inputField = `<select name="${name}" ${(id) ? 'id="' + id + '"' : ''} class="${finalClass}">${value}</select>`;
        }
        else if (type === 'checkbox') {
            // ✅ full-width label-row for checkbox
            inputField = `
                <div class="flex items-center gap-3 w-full">
                    <input
                        type="checkbox"
                        ${(id) ? 'id="' + id + '"' : ''}
                        name="${name}"
                        value="true"
                        class="w-5 h-5 accent-blue-500"
                    />
                    <label for="${id || name}" class="text-white text-sm">${label || placeholder}</label>
                </div>
            `;
        }
        else {
            inputField = `<input
                type="${type}"
                ${(id) ? 'id="' + id + '"' : ''}
                name="${name}"
                placeholder="${placeholder}"
                value="${value}"
                class="${finalClass}"
            />`;
        }


        let confirmInput = '';
        if (withConfirm && type === 'password') {
            confirmInput = `
                <div class="detail-row hidden" ${(id) ? 'id="' + id + '-confirm-row"' : ''}>
                    <label class="label">Confirm Password:</label>
                    <input class="input" type="password" name="passwordConfirm" placeholder="Repeat ${placeholder}" />
                </div>
            `;
        }

        // Auto-bind show/hide logic after render
        if (withConfirm && type === 'password' && id) {

            // Return special placeholder to call later
            const listenerScript = `<script>window.__deferredConfirmFields = window.__deferredConfirmFields || []; window.__deferredConfirmFields.push({id: "${id}", name: "${name}"});</script>`;
            return this.render(`
                <div class="detail-row">
                    <label class="label" for="${id || name}">${label || placeholder || name}:</label>
                    ${inputField}
                </div>
                ${confirmInput}
                ${listenerScript}
            `);
        }

        if (type === 'display') {
            return this.render(`
                <div class="detail-row">
                    <label class="label">${label || placeholder || name}:</label>
                    <span class="value">${value || ''}</span>
                </div>
                ${confirmInput}
            `);
        }

        if (bare) {
            return this.render(inputField + confirmInput);
        }

        return this.render(`
            <div class="detail-row">
                <label class="label" for="${id || name}">${label || placeholder || name}:</label>
                ${inputField}
            </div>
            ${confirmInput}
        `);
    }

    async renderNumericGroup(count: number, baseId: string): Promise<string> {
        const inputs: string[] = [];
        const nameMap = ['one', 'two', 'three', 'four', 'five', 'six'];

        for (let i = 0; i < count; i++) {
            const id = `${baseId}_${nameMap[i]}`;

            inputs.push(await this.renderInput({
                id,
                name: id,
                type: 'tel',
                bare: true,
                className: 'tf_numeric w-12 h-12 text-center text-xl border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white',
            }));
        }

        const halfway = Math.floor(count / 2);
        return `
            <div class="flex justify-center space-x-2">
                ${inputs.slice(0, halfway).join('\n')}
                <div class="spacer w-4"></div>
                ${inputs.slice(halfway).join('\n')}
            </div>
        `;
    }

    async renderInputGroup(inputs: InputProps[]): Promise<string> {
        const renderedInputs: string[] = [];

        for (const input of inputs) {
            const html = await this.renderInput(input);
            renderedInputs.push(html);
        }

        return this.render(renderedInputs.join('\n'));
    }

    async getHtml(): Promise<string> {
        return this.render(`<input placeholder="Default Input" />`);
    }
}
