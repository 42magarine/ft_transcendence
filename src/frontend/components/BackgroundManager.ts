import { getThemeBackground, ThemeName } from '../theme/themeHelpers.js';

let currentBackgroundTheme: ThemeName | null = null;

export function setBackgroundImageByTheme(theme: ThemeName) {
	if (theme === currentBackgroundTheme) return;

	const app = document.getElementById('app');
	if (!app) return;

	const imagePath = getThemeBackground(theme);
	const img = new Image();
	img.src = imagePath;

	img.onload = () => {
		app.style.backgroundImage = `url('${imagePath}')`;
		app.style.backgroundSize = 'cover';
		app.style.backgroundPosition = 'center';
		app.style.backgroundRepeat = 'no-repeat';
		app.style.transition = 'background-image 0.01s ease-in-out';

		currentBackgroundTheme = theme;
	};
}
