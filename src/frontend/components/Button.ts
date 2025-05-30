import AbstractView from '../../utils/AbstractView.js';
import { ButtonProps, ButtonGroupProps, InputProps, ToggleProps } from '../../interfaces/abstractViewInterfaces.js';
import Input from './Input.js';

// This class handles rendering individual buttons and grouped button components with optional inputs and toggles
export default class Button extends AbstractView {
    constructor(params: URLSearchParams = new URLSearchParams()) {
        super(params);
    }

    // Renders a single button based on ButtonProps
    async renderButton({
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
        dataAttributes = {}
    }: ButtonProps): Promise<string> {
        // Maps status values to color classes
        const statusClassMap: Record<string, string> = {
            ready: 'btn-success',
            waiting: 'btn-warning',
            unavailable: 'btn-danger',
        };

        // Maps alignment to text-alignment utility classes
        const alignmentMap: Record<string, string> = {
            left: 'text-left',
            center: 'text-center',
            right: 'text-right',
        };

        // Final class based on status
        const statusClass = status ? statusClassMap[status] || '' : '';
        const alignClass = alignmentMap[align] || '';

        // Special case for Google Sign-In button using Google's JS API widget
        if (type === 'google-signin') {
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

        // Builds full class list for the button
        const finalClass = ['btn', statusClass, className].join(' ').trim();
        const clickAttr = onClick ? `onclick="${onClick}"` : '';
        const content = `${iconHtml || ''}${text || ''}`.trim(); // Includes optional icon HTML
        const dataAttrs = Object.entries(dataAttributes)
            .map(([key, value]) => `data-${key}="${value}"`)
            .join(' ');

        // Render either as <a> or <button> based on presence of href
        // const buttonHtml = href
        //     ? `<a id="${id}" href="${href}" router class="${finalClass}">${content}</a>`
        //     : `<button id="${id}" type="${type}" class="${finalClass}" ${clickAttr}>${content}</button>`;
        
        const buttonHtml = href
            ? `<a id="${id}" href="${href}" router class="${finalClass}" ${dataAttrs}>${content}</a>`
            : `<button id="${id}" type="${type}" class="${finalClass}" ${clickAttr} ${dataAttrs}>${content}</button>`;

        let combinedHtml = buttonHtml;

        // If button type is 'text-with-button', prefix textBefore content
        if (type === 'text-with-button' && textBefore) {
            combinedHtml = `
				<span class="inline-block mr-2 text-sm text-gray-600">${textBefore}</span>
				${buttonHtml}
			`;
        }

        // Wrap the button in a container div with alignment class
        return this.render(`<div class="${alignClass}">${combinedHtml}</div>`);
    }

    // Renders a button group, optionally including inputs and toggles
    async renderGroup({
        buttons = [],
        inputs = [],
        toggles = [],
        align = 'left',
        layout = 'group',
        columns = 2,
        className = '',
    }: ButtonGroupProps & { inputs?: InputProps[]; toggles?: ToggleProps[] }): Promise<string> {
        // Defines layout styles for grouping buttons and inputs
        const layoutClasses: Record<string, string> = {
            group: 'btn-group flex flex-row gap-2',
            stack: 'btn-stack',
            grid: `btn-grid grid grid-cols-${columns}`,
            flex: 'btn-flex flex flex-wrap gap-4 items-center',
        };

        // Defines alignment classes
        const alignmentMap: Record<string, string> = {
            left: 'justify-start',
            center: 'justify-center',
            right: 'justify-end',
        };

        const layoutClass = layoutClasses[layout] || '';
        const alignmentClass = alignmentMap[align] || '';

        // Render inline inputs (e.g., displayname, email)
        const inputRenderer = new Input();
        const renderedInputs = await Promise.all(
            (inputs || []).map(input => inputRenderer.renderInput({ ...input, bare: true }))
        );

        // Render toggle switches (e.g., emailVerified, 2FA)
        const Toggle = (await import('./Toggle.js')).default;
        const toggleRenderer = new Toggle();

        const renderedToggles = await Promise.all(
            (toggles || []).map(t => toggleRenderer.renderToggle(t))
        );

        // Render all buttons passed in
        const renderedButtons = await Promise.all(
            (buttons || []).map(btn => this.renderButton(btn))
        );

        // Combine all components and render in a flex/grid layout
        return this.render(`
			<div class="${className} ${layoutClass} ${alignmentClass}">
				${[...renderedInputs, ...renderedButtons, ...renderedToggles].join('\n')}
			</div>
		`);
    }

    // Default rendering if called standalone (fallback)
    async getHtml(): Promise<string> {
        return this.render(`<button class="btn">Default Button</button>`);
    }
}
