import Router from '../../utils/Router.js';

export class AccessibilityService {
	private static textSize: string = 'normal-textSize';
	private static contrast: string = 'normal-contrast';
	private static dropdownStates = new Map<HTMLElement, boolean>();

	static getCurrentTextSize(): string {
		const textSizeCookie = document.cookie
			.split('; ')
			.find(row => row.startsWith('accessibility_text_size='));
		return textSizeCookie ? textSizeCookie.split('=')[1] : 'normal';
	}

	static getCurrentContrast(): string {
		const contrastCookie = document.cookie
			.split('; ')
			.find(row => row.startsWith('accessibility_contrast='));
		return contrastCookie ? contrastCookie.split('=')[1] : 'normal';
	}

	static applyAccessibilities() {
		const body = document.querySelector('body');
		if (!body) return;

		body.classList.remove(
			'normal-contrast',
			'high-contrast',
			'normal-textSize',
			'big-textSize',
			'huge-textSize'
		);

		body.classList.add(this.contrast);
		body.classList.add(this.textSize);

		const contrastValue = this.contrast.replace('-contrast', '');
		const textSizeValue = this.textSize.replace('-textSize', '');

		document.cookie = `accessibility_contrast=${contrastValue}; path=/; max-age=31536000`;
		document.cookie = `accessibility_text_size=${textSizeValue}; path=/; max-age=31536000`;
	}

	static setupAccessibilitySwitches() {
        console.log('[Accessibility] contrastBtn:', document.getElementById('contrast-btn'));

		const contrastCookie = this.getCurrentContrast();
		const textSizeCookie = this.getCurrentTextSize();

		this.contrast = `${contrastCookie}-contrast`;
		this.textSize = `${textSizeCookie}-textSize`;

		// Apply immediately
		this.applyAccessibilities();

		// Add listeners by ID
		const contrastBtn = document.getElementById('contrast-btn');
		const textSizeBtn = document.getElementById('textsize-btn');

		contrastBtn?.addEventListener('click', (e) => {
			e.preventDefault();
			this.toggleContrast();
		});
		contrastBtn?.addEventListener('keydown', (e) => {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				this.toggleContrast();
			}
		});

		textSizeBtn?.addEventListener('click', (e) => {
			e.preventDefault();
			this.cycleTextSize();
		});
		textSizeBtn?.addEventListener('keydown', (e) => {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				this.cycleTextSize();
			}
		});
	}

	private static toggleContrast() {
		this.contrast = this.contrast === 'normal-contrast' ? 'high-contrast' : 'normal-contrast';
		this.applyAccessibilities();
	}

	private static cycleTextSize() {
		if (this.textSize === 'normal-textSize') {
			this.textSize = 'big-textSize';
		} else if (this.textSize === 'big-textSize') {
			this.textSize = 'huge-textSize';
		} else {
			this.textSize = 'normal-textSize';
		}
		this.applyAccessibilities();
	}

	static setupDropdownKeyboardNavigation() {
		document.addEventListener('keydown', (e) => {
			const activeElement = document.activeElement as HTMLElement;

			if (e.key === ' ' && activeElement?.classList.contains('dropdown-head')) {
				e.preventDefault();
				e.stopImmediatePropagation();

				const dropdown = activeElement.closest('.dropdown');
				if (dropdown) {
					const currentState = this.dropdownStates.get(activeElement) || false;
					const newState = !currentState;

					this.dropdownStates.set(activeElement, newState);

					setTimeout(() => {
						activeElement.setAttribute('aria-expanded', newState.toString());
						dropdown.classList.toggle('open', newState);
					}, 0);
				}
			}

			if ((e.key === 'Enter' || e.key === 'Space') && activeElement?.closest('.dropdown-item')) {
				e.preventDefault();
				if (activeElement.tagName === 'BUTTON') {
					activeElement.click();
				} else if (activeElement.tagName === 'A') {
					activeElement.click();
				}
			}

			if (e.key === 'Escape') {
				const openDropdowns = document.querySelectorAll('.dropdown-head[aria-expanded="true"]');
				openDropdowns.forEach(head => {
					this.dropdownStates.set(head as HTMLElement, false);
					head.setAttribute('aria-expanded', 'false');
					head.closest('.dropdown')?.classList.remove('open');
				});
			}
		});
	}

	static setupLanguageDropdown() {
		setTimeout(() => {
			const dropdown = document.getElementById('language-dropdown');
			if (dropdown) {
				const buttons = dropdown.querySelectorAll('button[data-lang]');
				const images = dropdown.querySelectorAll('img[data-lang]');

				buttons.forEach(button => {
					button.addEventListener('click', (e) => {
						const lang = (e.currentTarget as HTMLElement).getAttribute('data-lang');
						if (lang) {
							localStorage.setItem('lang', lang);
							Router.update();
						}
					});

					button.addEventListener('keydown', (e) => {
						const keyEvent = e as KeyboardEvent;
						if (keyEvent.key === 'Enter' || keyEvent.key === 'Space') {
							e.preventDefault();
							const lang = (keyEvent.currentTarget as HTMLElement).getAttribute('data-lang');
							if (lang) {
								localStorage.setItem('lang', lang);
								Router.update();
							}
						}
					});
				});

				images.forEach(img => {
					img.addEventListener('click', (e) => {
						const lang = (e.currentTarget as HTMLElement).getAttribute('data-lang');
						if (lang) {
							localStorage.setItem('lang', lang);
							Router.update();
						}
					});
				});
			}
		}, 100);
	}

	static observeDOMChanges() {
		const observer = new MutationObserver(() => {
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	static initialize() {
		this.setupDropdownKeyboardNavigation();
		this.setupAccessibilitySwitches();
		this.setupLanguageDropdown();
        this.observeDOMChanges();
	}
}

AccessibilityService.initialize(); // Instead of calling methods individually