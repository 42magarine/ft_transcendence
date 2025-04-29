import AbstractView from '../../utils/AbstractView.js';
import { themedBtn } from '../theme/themeHelpers.js';

export interface ButtonProps {
	id: string;
	text: string;
	className?: string;
	type?: 'submit' | 'button';
	onClick?: string;
	href?: string;
}

interface ButtonGroupProps {
	buttons: ButtonProps[];
	align?: 'left' | 'center' | 'right';
	layout?: 'group' | 'stack' | 'grid' | 'flex';
	columns?: number;
}

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
	}: ButtonProps): Promise<string> {
		const theme = this.props?.theme || 'default';
		console.log("renderButton theme:", theme);
		const finalClass = className || themedBtn(theme);
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
			<div class="${layoutClass} ${alignmentClass}">
				${renderedButtons.join('\n')}
			</div>
		`);
	}

	async getHtml(): Promise<string> {
		const theme = this.props?.theme || 'default';
		const btnClass = themedBtn(theme);

		return this.render(`<button class="${btnClass}">Default Button</button>`);
	}
}
