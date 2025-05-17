import AbstractView from '../../utils/AbstractView.js';
import { ButtonProps, ButtonGroupProps } from '../../interfaces/abstractViewInterfaces.js'

export default class Button extends AbstractView {
    constructor(params: URLSearchParams = new URLSearchParams()) {
        super(params);
    }

    async renderButton({
        id,
        text,
        className = '',
        type = 'button',
        onClick = '',
        href,
        status,
    }: ButtonProps): Promise<string> {
        const statusClassMap: Record<string, string> = {
            ready: 'btn-success',
            waiting: 'btn-warning',
            unavailable: 'btn-danger',
        };

        const statusClass = status ? statusClassMap[status] || '' : '';
        const finalClass = ['btn', statusClass, className].join(' ').trim();
        const clickAttr = onClick ? `onclick="${onClick}"` : '';

        if (href) {
            return this.render(`
				<a id="${id}" href="${href}" router class="${finalClass}">
					${text}
				</a>
			`);
        }

        return this.render(`
			<button id="${id}" type="${type}" class="${finalClass}" ${clickAttr}>
				${text}
			</button>
		`);
    }


    async renderGroup({
        buttons,
        align = 'left',
        layout = 'group',
        columns = 2,
        className = ""
    }: ButtonGroupProps): Promise<string> {
        const layoutClasses: Record<string, string> = {
            group: 'btn-group',
            stack: 'btn-stack',
            grid: `btn-grid grid grid-cols-${columns}`,
            flex: 'btn-flex flex flex-wrap gap-4 items-center',
        };

        const alignmentMap: Record<string, string> = {
            left: 'justify-start',
            center: 'justify-center',
            right: 'justify-end',
        };

        const layoutClass = layoutClasses[layout] || '';
        const alignmentClass = alignmentMap[align] || '';

        const renderedButtons = await Promise.all(
            buttons.map(btn => this.renderButton(btn))
        );

        return this.render(`
			<div class="${className} ${layoutClass} ${alignmentClass}">
				${renderedButtons.join('\n')}
			</div>
		`);
    }

    async getHtml(): Promise<string> {
        return this.render(`<button class="btn">Default Button</button>`);
    }
}
