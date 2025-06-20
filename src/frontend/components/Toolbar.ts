import AbstractView from '../../utils/AbstractView.js';
import { ToolbarProps } from '../../interfaces/componentInterfaces.js';

export default class Toolbar extends AbstractView {
    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
    }

    async renderToolbar({ buttons, className = '' }: ToolbarProps): Promise<string> {
        const buttonHtml = buttons.map((btn) => `
			<button
				${btn.id ? `id="${btn.id}"` : ''}
				class="btn btn-sm btn-secondary ${btn.className || ''}"
				${btn.onClick ? `onclick="${btn.onClick}"` : ''}
			>
				${btn.text}
			</button>
		`).join('\n');

        return this.render(
            `<div class="toolbar flex gap-2 justify-end ${className}">
				${buttonHtml}
			</div>`
        );
    }

    async renderBlock(props: ToolbarProps): Promise<string> {
        return this.renderToolbar(props);
    }

    async getHtml(): Promise<string> {
        return await this.renderToolbar({
            buttons: [
                { text: 'Cancel', onClick: `console.log('Cancel')` },
                { text: 'Save', onClick: `console.log('Save')`, className: 'btn-primary' },
            ]
        });
    }
}
