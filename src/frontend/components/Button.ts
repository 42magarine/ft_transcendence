import AbstractView from '../../utils/AbstractView.js';
import { ButtonProps, ButtonGroupProps, InputProps, ToggleProps } from '../../interfaces/componentInterfaces.js';
import Input from './Input.js';
import renderGoogleSignInButton from './GoogleSignIn.js';

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
        color,
        icon = '',
        align = 'center',
        textBefore = '',
        dataAttributes = {}
    }: ButtonProps): Promise<string> {
        // Render special button for Google Sign-In
        if (type === 'google-signin')
            return renderGoogleSignInButton(align);

        let finalClass = 'btn'; // Always include base class

        // Apply color class independently
        if (color)
            finalClass += ` btn-${color}`;
        else if (type === 'submit')
            finalClass += ' btn-green';
        else if (type === 'delete')
            finalClass += ' btn-red';
        else
            finalClass += ' btn-primary'; // default

        // Add custom styling className if provided (e.g. outline, spacing)
        if (className)
            finalClass += ` ${className.trim()}`;


        // Sets text alignment for the container div (e.g., text-left, text-center)
        let alignClass = '';
        if (align)
            alignClass = `text-${align}`;

        // Adds JavaScript function call on button click
        let clickAttr = '';
        if (onClick)
            clickAttr = `onclick="${onClick}"`;


        // Add any extra data-* attributes to the element
        let dataAttrs = '';
        if (dataAttributes && Object.keys(dataAttributes).length > 0) {
            for (const [key, value] of Object.entries(dataAttributes)) {
                dataAttrs += `data-${key}="${value}" `;
            }

            dataAttrs = dataAttrs.trim(); // Remove trailing space
        }

        // Combine icon and text, fallback to empty strings if undefined

        // Handle icon rendering if icon prop is provided
        let iconHtml = '';
        if (icon) {
            iconHtml = `<i class="fa-solid fa-${icon}"></i>`;
        }

        let content = '';
        if (iconHtml && text) {
            content = `${iconHtml}<span class="ml-2">${text}</span>`;
        }
        else {
            content = iconHtml || text || '';
        }

        let element = '';

        // If it's a link-style button
        if (href)
            element = `<a id="${id}" href="${href}" router class="${finalClass}" ${dataAttrs}>${content}</a>`;
        else
            element = `<button id="${id}" type="${type}" class="${finalClass}" ${clickAttr} ${dataAttrs}>${content}</button>`;

        let combined = '';

        // Special layout for buttons that include inline text before the button (e.g., "Don't have an account? [Sign Up]")
        if (type === 'text-with-button')
            combined = `<span class="inline-block mr-2 text-sm text-gray-600">${textBefore}</span>${element}`;
        else
            combined = element;

        // Wrap everything inside a div with the proper alignment class
        return this.render(`<div class="${alignClass}">${combined}</div>`);
    }

    async renderButtonGroup({
        buttons = [],
        inputs = [],
        toggles = [],
        align = 'center',
        layout = 'group',
        columns = 2,
        className = ''
    }: ButtonGroupProps & { inputs?: InputProps[]; toggles?: ToggleProps[] }): Promise<string> {
        // Define layout styles based on group type
        const layoutMap: Record<string, string> = {
            group: 'flex flex-row gap-2',                 // horizontal button group
            stack: 'flex flex-col gap-2',                 // vertical stack
            grid: `grid grid-cols-${columns} gap-2`,      // grid layout with specified column count
            flex: 'flex flex-wrap gap-4 items-center'     // responsive flex wrap layout
        };

        // Select layout class if it exists in the map
        let layoutClass = '';
        if (layout && layoutMap[layout]) {
            layoutClass = layoutMap[layout];
        }

        // Set text alignment class (left, center, right)
        let alignmentClass = '';
        if (align) {
            alignmentClass = `justify-${align}`;
        }

        // Render all input fields using the Input component
        const inputsHtml: string[] = [];
        if (inputs.length > 0) {
            for (const input of inputs) {
                const html = await new Input().renderInput({ ...input, bare: true });
                inputsHtml.push(html);
            }
        }

        // Render toggle switches (lazy-loaded)
        const togglesHtml: string[] = [];
        if (toggles.length > 0) {
            const Toggle = (await import('./Toggle.js')).default;
            const toggleRenderer = new Toggle();
            for (const toggle of toggles) {
                const html = await toggleRenderer.renderToggle(toggle);
                togglesHtml.push(html);
            }
        }

        // Render buttons using your custom Button renderer
        const buttonsHtml: string[] = [];
        if (buttons.length > 0) {
            for (const btn of buttons) {
                const html = await this.renderButton(btn);
                buttonsHtml.push(html);
            }
        }

        // Merge all blocks into one output HTML string
        const allHtmlBlocks = [...inputsHtml, ...buttonsHtml, ...togglesHtml].join('\n');

        // Return the final HTML wrapped in a container with layout and alignment classes
        return this.render(`
            <div class="${layoutClass} ${alignmentClass} ${className}">
                ${allHtmlBlocks}
            </div>
        `);
    }

    async getHtml(): Promise<string> {
        return this.render(`<button class="btn">Default Button</button>`);
    }
}
