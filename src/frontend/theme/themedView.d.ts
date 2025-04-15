import AbstractView from '../../utils/AbstractView.js';
import type { ThemeName } from './themeHelpers.js';
export default abstract class ThemedView extends AbstractView {
    protected theme: ThemeName;
    constructor(theme: ThemeName, title: string, params?: URLSearchParams);
    getTheme(): string;
    getHtml(): Promise<string>;
    abstract renderView(): Promise<string>;
}
