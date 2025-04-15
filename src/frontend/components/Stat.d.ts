import AbstractView from '../../utils/AbstractView.js';
interface StatProps {
    label: string;
    value: string | number;
    className?: string;
}
export default class Stat extends AbstractView {
    constructor(params?: URLSearchParams);
    renderStat({ label, value, className }: StatProps): Promise<string>;
    getHtml(): Promise<string>;
}
export {};
