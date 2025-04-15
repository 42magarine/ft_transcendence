import AbstractView from '../../utils/AbstractView.js';
import { applyThemeSetup } from './themeSetup.js';
export default class ThemedView extends AbstractView {
    theme;
    constructor(theme, title, params) {
        super(params || new URLSearchParams());
        this.theme = theme;
        this.setTitle(title);
    }
    getTheme() {
        return this.theme;
    }
    async getHtml() {
        await applyThemeSetup(this);
        return this.renderView();
    }
}
