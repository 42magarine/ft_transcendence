import AbstractView from '../../utils/AbstractView.js';
export default class Header extends AbstractView {
    constructor(params?: URLSearchParams);
    getHtml(): Promise<string>;
}
