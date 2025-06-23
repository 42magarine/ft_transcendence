import AbstractView from '../../utils/AbstractView.js';
import Button from './Button.js';
import { ButtonProps, ButtonColor } from '../../interfaces/componentInterfaces.js';

export interface DropdownItem {
	id?: string;
	text: string;
	type?: 'link' | 'button';
	icon?: string;
	href?: string;
	className?: string;
	dataAttributes?: Record<string, string>;
    color?: ButtonColor;
}

export interface DropdownProps {
    id: string;
    head: {
        text?: string;
        icon?: string;
        img?: string;
    };
    items: DropdownItem[];
    headClass?: string;
    bodyClass?: string;
}

export default class Dropdown extends AbstractView {
    constructor(params: Record<string, string> = {}) {
        super(params);
    }    

    async renderDropdown({
        id,
        head,
        items,
        headClass = '',
        bodyClass = '',
    }: DropdownProps): Promise<string> {
        const button = new Button();
        const headContent = `
            ${head.text ? `<div class="dropdown-name">${head.text}</div>` : ''}
            ${head.img ? `<div class="dropdown-img"><img src="${head.img}" class="w-6 h-6 rounded-full" /></div>` : ''}
            ${head.icon ? `<div class="dropdown-icon"><i class="fa-solid fa-${head.icon}"></i></div>` : ''}
        `;

        let bodyContent = '';
        for (const item of items) {
            let itemHtml = '';
            if (item.type === 'link' || item.href) {
                itemHtml = `<a router href="${item.href}" class="dropdown-item ${item.className || ''}">
                    ${item.icon ? `<i class="fa-solid fa-${item.icon} mr-2"></i>` : ''}${item.text}
                </a>`;
            } else {
                itemHtml = await button.renderButton({
                    id: item.id,
                    text: item.text,
                    icon: item.icon,
                    type: item.type === 'button' ? 'button' : 'button',
                    className: `dropdown-item ${item.className || ''}`,
                    color: item.color || 'gray',
                });
            }
            bodyContent += `<div class="dropdown-item-wrap">${itemHtml}</div>`;
        }

        return `
            <div id="${id}" class="dropdown">
                <div class="dropdown-head ${headClass}">
                    ${headContent}
                </div>
                <div class="dropdown-body ${bodyClass}">
                    ${bodyContent}
                </div>
            </div>
        `;
    }
    async getHtml(): Promise<string> {
        return '';
    }
}

