import AbstractView from '../../utils/AbstractView.js';
interface ToggleProps {
    id: string;
    label: string;
    checked?: boolean;
}
export default class Toggle extends AbstractView {
    constructor(params?: URLSearchParams);
    renderToggle({ id, label, checked }: ToggleProps): Promise<string>;
    getHtml(): Promise<string>;
}
export {};
