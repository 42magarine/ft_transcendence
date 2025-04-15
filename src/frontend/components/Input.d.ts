import AbstractView from '../../utils/AbstractView.js';
interface InputProps {
    name: string;
    type?: string;
    placeholder?: string;
    value?: string;
    className?: string;
}
export default class Input extends AbstractView {
    constructor(params?: URLSearchParams);
    renderInput({ name, type, placeholder, value, className }: InputProps): Promise<string>;
    getHtml(): Promise<string>;
}
export {};
