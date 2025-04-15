import { setBackgroundImageByTheme } from '../components/BackgroundManager.js';
import Header from '../components/Header.js';
let lastAppliedTheme = null;
export async function applyThemeSetup(viewInstance) {
    const theme = (viewInstance.getTheme?.() || 'default');
    // 🌌 Set background image only if the theme changed
    if (theme !== lastAppliedTheme) {
        setBackgroundImageByTheme(theme);
        // Render and inject header
        const header = new Header(new URLSearchParams({ theme }));
        const headerHtml = await header.getHtml();
        const headerContainer = document.getElementById('header');
        if (headerContainer)
            headerContainer.innerHTML = headerHtml;
        lastAppliedTheme = theme;
    }
}
