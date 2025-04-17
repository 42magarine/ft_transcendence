import { getThemeBackground, ThemeName } from '../theme/themeHelpers.js';

let currentBackgroundTheme: ThemeName | null = null;

export function setBackgroundImageByTheme(theme: ThemeName) {
	if (theme === currentBackgroundTheme) return;

	const app = document.getElementById('app');
	if (!app) return;
	app.setAttribute("data-theme", theme)
}
