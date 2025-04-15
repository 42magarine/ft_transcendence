import AbstractView from '../../utils/AbstractView.js';
export default class Footer extends AbstractView {
    constructor(params?: URLSearchParams);
    getHtml(): Promise<string>;
}
