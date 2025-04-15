import AbstractView from '../../utils/AbstractView.js';
import { ButtonProps } from './Button.js';
interface ToolbarProps {
    buttons: ButtonProps[];
    align?: 'left' | 'center' | 'right';
}
export default class Toolbar extends AbstractView {
    constructor(params?: URLSearchParams);
    renderToolbar({ buttons, align }: ToolbarProps): Promise<string>;
    getHtml(): Promise<string>;
}
export {};
