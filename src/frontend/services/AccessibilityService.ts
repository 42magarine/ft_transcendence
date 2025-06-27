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
        const body = document.querySelector("body");
        if (!body) return;

        body.classList.remove("normal-contrast", "high-contrast", "normal-textSize", "big-textSize", "huge-textSize");

        body.classList.add(this.contrast);
        body.classList.add(this.textSize);

        const contrastValue = this.contrast.replace('-contrast', '');
        const textSizeValue = this.textSize.replace('-textSize', '');

        document.cookie = `accessibility_contrast=${contrastValue}; path=/; max-age=31536000`; // 1 year
        document.cookie = `accessibility_text_size=${textSizeValue}; path=/; max-age=31536000`; // 1 year
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

    static setupAccessibilitySwitches() {
        const contrastSwitches = document.querySelectorAll('.contrastSwitch') as NodeListOf<HTMLElement>;
        const textsizeSwitches = document.querySelectorAll('.textsizeSwitch') as NodeListOf<HTMLElement>;

        if (!contrastSwitches || !textsizeSwitches) {
            return;
        }

        const getCookieValue = (name: string): string | null => {
            const cookies = document.cookie.split('; ');
            const cookie = cookies.find(c => c.startsWith(name + '='));
            return cookie ? cookie.split('=')[1] : null;
        };

        // Konsistente Cookie-zu-Klassen-Zuordnung
        const contrastCookie = getCookieValue('accessibility_contrast') || 'normal';
        const textSizeCookie = getCookieValue('accessibility_text_size') || 'normal';

        this.contrast = contrastCookie + '-contrast';
        this.textSize = textSizeCookie + '-textSize';

        this.applyAccessibilities();

        const handleContrastToggle = () => {
            if (this.contrast === 'normal-contrast') {
                this.contrast = 'high-contrast';
            } else {
                this.contrast = 'normal-contrast';
            }
            this.applyAccessibilities();
        };

        const handleTextsizeToggle = () => {
            if (this.textSize === 'normal-textSize') {
                this.textSize = 'big-textSize';
            } else if (this.textSize === 'big-textSize') {
                this.textSize = 'huge-textSize';
            } else {
                this.textSize = 'normal-textSize';
            }
            this.applyAccessibilities();
        };

        contrastSwitches.forEach(contrastSwitch => {
            
            // Use capture phase to catch events before other handlers
            contrastSwitch.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // Stop all other handlers
                handleContrastToggle();
            }, true); // true = capture phase
            
            // Also try with normal bubbling as backup
            contrastSwitch.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleContrastToggle();
            }, false);
        
            contrastSwitch.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleContrastToggle();
                }
            });
        });
        
        textsizeSwitches.forEach(textsizeSwitch => {
            
            // Use capture phase to catch events before other handlers
            textsizeSwitch.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // Stop all other handlers
                handleTextsizeToggle();
            }, true); // true = capture phase
            
            // Also try with normal bubbling as backup
            textsizeSwitch.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTextsizeToggle();
            }, false);
        
            textsizeSwitch.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTextsizeToggle();
                }
            });
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
                            Router.update()
                        }
                    });

                    button.addEventListener('keydown', (e) => {
                        const keyEvent = e as KeyboardEvent;
                        if (keyEvent.key === 'Enter' || keyEvent.key === 'Space') {
                            keyEvent.preventDefault();
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

    static initialize() {
        this.setupDropdownKeyboardNavigation();
        this.setupAccessibilitySwitches();
        this.setupLanguageDropdown();
    }
}

AccessibilityService.initialize();