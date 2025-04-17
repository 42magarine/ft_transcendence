import AbstractView from '../../utils/AbstractView.js';
import { applyThemeSetup } from './themeSetup.js';
import type { ThemeName } from './themeHelpers.js';

export default abstract class ThemedView extends AbstractView {
	protected theme: ThemeName;

	constructor(theme: ThemeName, title: string, params?: URLSearchParams) {
		const finalParams = params || new URLSearchParams();
		finalParams.set('theme', theme);
		super(finalParams);
		this.theme = theme;
		this.setTitle(title);
	}
	

	getTheme(): string {
		return this.theme;
	}

	async getHtml(): Promise<string> {
		await applyThemeSetup(this);
		return this.renderView();
	}

	abstract renderView(): Promise<string>;
}
