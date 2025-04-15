import AbstractView from '../../utils/AbstractView.js';
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
    constructor(params?: URLSearchParams);
    renderButton({ id, text, className, type, onClick, href, }: ButtonProps): Promise<string>;
    renderGroup({ buttons, align, layout, columns, }: ButtonGroupProps): Promise<string>;
    getHtml(): Promise<string>;
}
export {};
