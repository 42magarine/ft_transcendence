import AbstractView from '../../utils/AbstractView.js';
interface TitleProps {
    title: string;
    subtitle?: string;
}
export default class Title extends AbstractView {
    private titleText;
    private subtitleText?;
    constructor(params: URLSearchParams | undefined, { title, subtitle }: TitleProps);
    getHtml(): Promise<string>;
}
export {};
