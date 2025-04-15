import AbstractView from '../../utils/AbstractView.js';
import Button from './/Button.js';
export default class Footer extends AbstractView {
    constructor(params = new URLSearchParams()) {
        super(params);
    }
    async getHtml() {
        const theme = this.props.theme || 'default';
        const themeClass = `footer-theme-${theme}`;
        const year = this.props.year || '2025';
        // ✅ Use your actual btn class system!
        const commonBtnClass = `btn btn-theme-${theme} text-sm`;
        const navButtons = await new Button().renderGroup({
            layout: 'flex',
            align: 'center',
            buttons: [
                { id: 'profileLink', text: '👤 Profile', className: commonBtnClass, href: '/profile' },
                { id: 'settingsLink', text: '⚙️ Settings', className: commonBtnClass, href: '/settings' },
                { id: 'darkModeToggle', text: '🌙 Dark Mode', className: commonBtnClass, onClick: 'toggleDarkMode()' },
            ]
        });
        return super.render(`
			<footer class="${themeClass} flex flex-col md:flex-row justify-between items-center text-sm py-2 px-6 w-full border-t border-white/10 bg-white/5 backdrop-blur-sm">
				<p class="text-white/80">&copy; ${year} Transcendence Project</p>
				${navButtons}
			</footer>

			<script>
				(() => {
					const savedTheme = localStorage.getItem('theme');
					if (savedTheme === 'dark') {
						document.documentElement.classList.add('dark');
					}
				})();

				window.toggleDarkMode = function () {
					const isDark = document.documentElement.classList.toggle('dark');
					localStorage.setItem('theme', isDark ? 'dark' : 'light');
				};
			</script>
		`);
    }
}
