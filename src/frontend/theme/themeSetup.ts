import { setBackgroundImageByTheme } from '../components/BackgroundManager.js';
import Header from '../components/Header.js';
import { ThemeName } from './themeHelpers.js';

let lastAppliedTheme: ThemeName | null = null;

export async function applyThemeSetup(viewInstance: { getTheme(): string }) {
	const theme = (viewInstance.getTheme?.() || 'default') as ThemeName;

	// 🌌 Set background image only if the theme changed
	if (theme !== lastAppliedTheme) {
		setBackgroundImageByTheme(theme);

		// Render and inject header
		const header = new Header(new URLSearchParams({ theme }));
		const headerHtml = await header.getHtml();
		const headerContainer = document.getElementById('header');
		if (headerContainer) headerContainer.innerHTML = headerHtml;

		lastAppliedTheme = theme;
	}
}

