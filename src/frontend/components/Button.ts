import AbstractView from '../../utils/AbstractView.js';
import { ButtonProps, ButtonGroupProps, InputProps, ToggleProps } from '../../interfaces/abstractViewInterfaces.js';
import Input from './Input.js';

export default class Button extends AbstractView
{
	constructor(params: URLSearchParams = new URLSearchParams())
	{
		super(params);
	}

	async renderButton(
	{
		id,
		text,
		className = '',
		type = 'button',
		onClick = '',
		href,
		status,
		iconHtml = '',
		align = 'center',
		textBefore = '',
	}: ButtonProps): Promise<string>
	{
		const statusClassMap: Record<string, string> =
		{
			ready: 'btn-success',
			waiting: 'btn-warning',
			unavailable: 'btn-danger',
		};

		const alignmentMap: Record<string, string> =
		{
			left: 'text-left',
			center: 'text-center',
			right: 'text-right',
		};

		const statusClass = status ? statusClassMap[status] || '' : '';
		const alignClass = alignmentMap[align] || '';

		if (type === 'google-signin')
		{
			return this.render(`
				<div class="${alignClass}">
					<div id="g_id_onload"
						data-client_id="671485849622-fgg1js34vhtv9tsrifg717hti161gvum.apps.googleusercontent.com"
						data-callback="handleGoogleLogin"
						data-auto_prompt="false">
					</div>
					<div class="g_id_signin"
						data-type="standard"
						data-size="medium"
						data-theme="filled_blue"
						data-text="signin_with"
						data-shape="rectangular"
						data-logo_alignment="left">
					</div>
				</div>
			`);
		}

		const finalClass = ['btn', statusClass, className].join(' ').trim();
		const clickAttr = onClick ? `onclick="${onClick}"` : '';
		const content = `${iconHtml || ''}${text || ''}`.trim();

		const buttonHtml = href
			? `<a id="${id}" href="${href}" router class="${finalClass}">${content}</a>`
			: `<button id="${id}" type="${type}" class="${finalClass}" ${clickAttr}>${content}</button>`;

		let combinedHtml = buttonHtml;
		if (type === 'text-with-button' && textBefore)
		{
			combinedHtml = `
				<span class="inline-block mr-2 text-sm text-gray-600">${textBefore}</span>
				${buttonHtml}
			`;
		}

		return this.render(`<div class="${alignClass}">${combinedHtml}</div>`);
	}

	async renderGroup(
	{
		buttons = [],
		inputs = [],
		toggles = [],
		align = 'left',
		layout = 'group',
		columns = 2,
		className = '',
	}: ButtonGroupProps & { inputs?: InputProps[]; toggles?: ToggleProps[] }): Promise<string>
	{
		const layoutClasses: Record<string, string> =
		{
			group: 'btn-group flex flex-row gap-2',
			stack: 'btn-stack',
			grid: `btn-grid grid grid-cols-${columns}`,
			flex: 'btn-flex flex flex-wrap gap-4 items-center',
		};

		const alignmentMap: Record<string, string> =
		{
			left: 'justify-start',
			center: 'justify-center',
			right: 'justify-end',
		};

		const layoutClass = layoutClasses[layout] || '';
		const alignmentClass = alignmentMap[align] || '';

		const inputRenderer = new Input();
		const renderedInputs = await Promise.all(
			(inputs || []).map(input => inputRenderer.renderInput({ ...input, bare: true }))
		);

		const Toggle = (await import('./Toggle.js')).default;
        const toggleRenderer = new Toggle();

        const renderedToggles = await Promise.all(
            (toggles || []).map(t => toggleRenderer.renderToggle(t))
        );

                

		const renderedButtons = await Promise.all(
			(buttons || []).map(btn => this.renderButton(btn))
		);

		return this.render(`
			<div class="${className} ${layoutClass} ${alignmentClass}">
				${[...renderedInputs, ...renderedButtons, ...renderedToggles].join('\n')}
			</div>
		`);
	}

	async getHtml(): Promise<string>
	{
		return this.render(`<button class="btn">Default Button</button>`);
	}
}
