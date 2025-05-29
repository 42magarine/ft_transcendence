import AbstractView from '../../utils/AbstractView.js';
import { ToolbarProps } from '../../interfaces/abstractViewInterfaces.js';

export default class Toolbar extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
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

		return this.render( // ✅ this is from AbstractView: (template, data?)
			`<div class="toolbar flex gap-2 justify-end ${className}">
				${buttonHtml}
			</div>`
		);
	}

	// ✅ Use a different name to avoid overriding AbstractView.render
	async renderBlock(props: ToolbarProps): Promise<string> {
		return this.renderToolbar(props);
	}

	// Optional preview renderer
	async getHtml(): Promise<string> {
		return await this.renderToolbar({
			buttons: [
				{ text: 'Cancel', onClick: `console.log('Cancel')` },
				{ text: 'Save', onClick: `console.log('Save')`, className: 'btn-primary' },
			]
		});
	}
}
