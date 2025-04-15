import AbstractView from '../../utils/AbstractView.js';
interface LabelProps {
    htmlFor: string;
    text: string;
    className?: string;
}
export default class Label extends AbstractView {
    constructor(params?: URLSearchParams);
    renderLabel({ htmlFor, text, className }: LabelProps): Promise<string>;
    getHtml(): Promise<string>;
}
export {};
