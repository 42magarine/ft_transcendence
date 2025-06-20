import AbstractView from '../../utils/AbstractView.js';
import { ButtonProps, ButtonGroupProps, InputProps, ToggleProps } from '../../interfaces/componentInterfaces.js';
import Input from './Input.js';
import renderGoogleSignInButton from './GoogleSignIn.js';

export default class Button extends AbstractView {
    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
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
        dataAttributes = {},
        aria = {}
    }: ButtonProps & { aria?: Record<string, string> }): Promise<string> {
        if (type === 'google-signin')
        {
            //return renderGoogleSignInButton(align);
        }

        let finalClass = 'btn text-inherit';

        if (color) finalClass += ` btn-${color}`;
        else if (type === 'submit') finalClass += ' btn-green';
        else if (type === 'delete') finalClass += ' btn-red';
        else finalClass += ' btn-primary';

        finalClass += ' text-inherit';
        if (className && !/text-(xs|sm|md|lg|xl)/.test(className)) {
            finalClass += ` ${className.trim()}`;
        }


        const alignClass = align ? `text-${align}` : '';

        const clickAttr = onClick ? `onclick="${onClick}"` : '';

        let dataAttrs = '';
        for (const [key, value] of Object.entries(dataAttributes || {})) {
            dataAttrs += `data-${key}="${value}" `;
        }
        dataAttrs = dataAttrs.trim();

        let ariaAttrs = '';
        for (const [key, value] of Object.entries(aria || {})) {
            ariaAttrs += `aria-${key}="${value}" `;
        }
        ariaAttrs = ariaAttrs.trim();

        // Icon rendering (if provided)
        const iconHtml = icon ? `<i class="fa-solid fa-${icon}"></i>` : '';
        // Combine icon and text with spacing and scaling support
        let content = '';
        if (iconHtml && text) {
            content = `${iconHtml}<span class="ml-2 text-inherit __">${text}</span>`;
        } else {
            content = iconHtml || `<span class="text-inherit __">${text}</span>`;
        }

        // Render as <a> or <button>
        const element = href
            ? `<a ${(id) ? 'id="' + id + '"' : ''} href="${href}" router class="${finalClass}" ${dataAttrs} ${ariaAttrs}>${content}</a>`
            : `<button aria-label="${text}" ${(id) ? 'id="' + id + '"' : ''} type="${type}" class="${finalClass}" ${clickAttr} ${dataAttrs} ${ariaAttrs}>${content}</button>`;

        // Optionally add inline label text before the button (e.g. "Don't have an account? [Sign up]")
        const combined = type === 'text-with-button'
            ? `<span class="inline-block mr-2 text-inherit __">${textBefore}</span>${element}`
            : element;

        // Wrap in a div with text alignment
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
        const layoutMap: Record<string, string> = {
            group: 'flex flex-row gap-2 items-center',
            stack: 'flex flex-col gap-2',
            grid: `grid grid-cols-${columns} gap-2`,
            flex: 'flex flex-wrap gap-4 items-center'
        };
        let layoutClass = layoutMap[layout] || '';
        let alignmentClass = align ? `justify-${align}` : '';

        const inputsHtml: string[] = [];
        for (const input of inputs || []) {
            const html = await new Input().renderInput({ ...input, bare: true });
            inputsHtml.push(html);
        }

        const togglesHtml: string[] = [];
        if (toggles.length > 0) {
            const Toggle = (await import('./Toggle.js')).default;
            const toggleRenderer = new Toggle();
            for (const toggle of toggles) {
                const html = await toggleRenderer.renderToggle(toggle);
                togglesHtml.push(html);
            }
        }

        const buttonsHtml: string[] = [];
        for (const btn of buttons || []) {
            const html = await this.renderButton(btn);
            buttonsHtml.push(html);
        }

        const allHtmlBlocks = [...inputsHtml, ...buttonsHtml, ...togglesHtml].join('\n');

        return this.render(`
            <div class="${layoutClass} ${alignmentClass} ${className}">
                ${allHtmlBlocks}
            </div>
        `);
    }

    async renderLanguageDropdown(): Promise<string> {
        const baseUrl = window.location.origin;
        const languages = [
            { code: 'en_EN', label: window.ls.__('English'), isActive: true },
            { code: 'de_DE', label: window.ls.__('German'), isActive: false },
            { code: 'it_IT', label: window.ls.__('Italian'), isActive: false },
            { code: 'my_MY', label: window.ls.__('Malayan'), isActive: false }
        ];

        const dropdownHtml = await this.renderDropdownGroup({
            id: 'language-dropdown',
            head: {
                img: `/dist/assets/flags/en_EN.svg`
            },
            items: languages.map(lang => ({
                img: `/dist/assets/flags/${lang.code}.svg`,
                text: lang.label,
                dataAttributes: { lang: lang.code }
            }))
        });
        return dropdownHtml;
    }

    async renderDropdownGroup({
        id,
        head,
        items
    }: {
        id: string;
        head: { icon?: string; img?: string; text?: string };
        items: Array<{
            icon?: string;
            img?: string;
            text: string;
            id?: string;
            href?: string;
            className?: string;
            dataAttributes?: Record<string, string>;
        }>;
    }): Promise<string> {
        const baseUrl = window.location.origin;
        const headContent = head.img
            ? `<img src="${baseUrl}${head.img}" alt="Dowpdown Icon ${window.ls.__(head.text || 'for ')}" class="flag active" />`
            : `<i class="fa-solid fa-${head.icon} mr-2"></i>${window.ls.__(head.text || '')}`;

        const itemsHtml = items.map(item => {
            const attrs = item.dataAttributes
                ? Object.entries(item.dataAttributes)
                    .map(([key, value]) => `data-${key}="${value}"`)
                    .join(' ')
                : '';

            const iconOrImg = item.img
                ? `<img src="${baseUrl}${item.img}" alt="${item.text}" class="flag passive" ${attrs} />`
                : `<i class="fa-solid fa-${item.icon} mr-2"></i>${window.ls.__(item.text)}`;
            if (item.href)
                return `<div class="dropdown-item"><a class="text-inherit ${item.className}" href="${item.href}" router tabindex="0">${iconOrImg}</a></div>`;
            else
                return `<div class="dropdown-item"><button class="text-inherit ${item.className}" aria-label="${item.text}" ${(item.id) ? 'id="' + item.id + '"' : ''} ${attrs} tabindex="0">${iconOrImg}</button></div>`;
        }).join('\n');

        return this.render(`
            <div class="dropdown" aria-expanded="true" ${(id) ? 'id="' + id + '"' : ''}>
                <div class="dropdown-head" tabindex="0" role="button" aria-haspopup="true" aria-expanded="false">
                    ${headContent}
                </div>
                <div class="dropdown-body" role="menu">
                    ${itemsHtml}
                </div>
            </div>
        `);
    }

    async getHtml(): Promise<string> {
        return this.render(`<button aria-label="Default Button" class="btn">Default Button</button>`);
    }
}
