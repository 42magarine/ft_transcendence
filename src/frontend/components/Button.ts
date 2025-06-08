import AbstractView from '../../utils/AbstractView.js';
import { ButtonProps, ButtonGroupProps, InputProps, ToggleProps } from '../../interfaces/componentInterfaces.js';
import Input from './Input.js';
import renderGoogleSignInButton from './GoogleSignIn.js';
import __ from '../services/LanguageService.js';

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
		if (type === 'google-signin')
			return renderGoogleSignInButton(align);

		let finalClass = 'btn';
		if (color) finalClass += ` btn-${color}`;
		else if (type === 'submit') finalClass += ' btn-green';
		else if (type === 'delete') finalClass += ' btn-red';
		else finalClass += ' btn-primary';

		if (className) finalClass += ` ${className.trim()}`;
		let alignClass = align ? `text-${align}` : '';
		let clickAttr = onClick ? `onclick="${onClick}"` : '';

		let dataAttrs = '';
		for (const [key, value] of Object.entries(dataAttributes || {})) {
			dataAttrs += `data-${key}="${value}" `;
		}
		dataAttrs = dataAttrs.trim();

		let iconHtml = icon ? `<i class="fa-solid fa-${icon}"></i>` : '';
		const translatedText = text ? __(text) : '';
		let content = iconHtml && translatedText ? `${iconHtml}<span class="ml-2">${translatedText}</span>` : iconHtml || translatedText;

		let element = href
			? `<a id="${id}" href="${href}" router class="${finalClass}" ${dataAttrs}>${content}</a>`
			: `<button id="${id}" type="${type}" class="${finalClass}" ${clickAttr} ${dataAttrs}>${content}</button>`;

		let combined = type === 'text-with-button'
			? `<span class="inline-block mr-2 text-sm text-gray-600">${textBefore}</span>${element}`
			: element;

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
			group: 'flex flex-row gap-2',
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
            { code: 'en_EN', label: 'English', isActive: true },
            { code: 'de_DE', label: 'Deutsch', isActive: false },
            { code: 'it_IT', label: 'Italiano', isActive: false },
            { code: 'my_MY', label: 'Malay', isActive: false }
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
    
        // ✅ Add language change logic
        setTimeout(() => {
            const dropdown = document.getElementById('language-dropdown');
            if (dropdown) {
                const flags = dropdown.querySelectorAll('img[data-lang]');
                flags.forEach(flag => {
                    flag.addEventListener('click', (e) => {
                        const lang = (e.currentTarget as HTMLElement).getAttribute('data-lang');
                        if (lang) {
                            localStorage.setItem('lang', lang);
                            location.reload();
                        }
                    });
                });
            }
        }, 0);
    
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
			dataAttributes?: Record<string, string>;
		}>;
	}): Promise<string> {
		const baseUrl = window.location.origin;
		const headContent = head.img
			? `<img src="${baseUrl}${head.img}" class="flag active" />`
			: `<i class="fa-solid fa-${head.icon} mr-2"></i>${__(head.text || '')}`;

		const itemsHtml = items.map(item => {
			const attrs = item.dataAttributes
				? Object.entries(item.dataAttributes)
						.map(([key, value]) => `data-${key}="${value}"`)
						.join(' ')
				: '';

			const iconOrImg = item.img
				? `<img src="${baseUrl}${item.img}" class="flag passive" ${attrs} />`
				: `<i class="fa-solid fa-${item.icon} mr-2"></i>${__(item.text)}`;

			if (item.href)
				return `<div class="dropdown-item"><a href="${item.href}" router>${iconOrImg}</a></div>`;
			else
				return `<div class="dropdown-item"><button id="${item.id || ''}" ${attrs}>${iconOrImg}</button></div>`;
		}).join('\n');

		return this.render(`
			<div class="dropdown" id="${id}">
				<div class="dropdown-head">${headContent}</div>
				<div class="dropdown-body">
					${itemsHtml}
				</div>
			</div>
		`);
	}
    

	async getHtml(): Promise<string> {
		return this.render(`<button class="btn">Default Button</button>`);
	}
}
