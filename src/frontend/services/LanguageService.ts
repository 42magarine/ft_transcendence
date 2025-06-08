import Router from "../../utils/Router.js";

export default class LanguageService {
    private isInitialized: boolean = false;
    private translations: Record<string, Record<string, string>> = {};

    constructor() {
        this.initialize();
        const langSelectActionHandler = () => {
            this.langSelectAction();
        };
        document.addEventListener('RouterContentLoaded', langSelectActionHandler);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', langSelectActionHandler);
        }
    }

    private async loadTranslations(): Promise<void> {
        try {
            const httpProtocol = window.location.protocol;
            const response = await fetch(`${httpProtocol}//${window.location.host}/dist/assets/languages/translation.json`);
            this.translations = await response.json();
        }
        catch (error) {
            console.error('Failed to load translations:', error);
        }
    }

    public __(key: string): string {
        const currentLanguage = this.getCurrentLanguage() || 'en_EN';

        if (key in this.translations) {
            const translation = this.translations[key][currentLanguage];
            return translation || key;
        }

        const keys = Object.keys(this.translations);
        for (const k of keys) {
            const translationObj = this.translations[k];

            if (typeof translationObj === 'object' && translationObj !== null && key in translationObj) {
                const nestedTranslation = translationObj[key];
                if (typeof nestedTranslation === 'object' && nestedTranslation !== null && currentLanguage in nestedTranslation) {
                    const translation = (nestedTranslation as Record<string, string>)[currentLanguage];
                    return translation || key;
                }
            }
        }
        return key;
    }

    private getCurrentLanguage(): string {
        const langCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('language='));

        return langCookie ? langCookie.split('=')[1] : 'en_EN';
    }

    private translateTextElements(): void {
        const elementsToTranslate = document.querySelectorAll('.__');
        elementsToTranslate.forEach((element, index) => {
            if (!element.getAttribute('data-original-text')) {
                const englishKey = element.textContent?.trim();
                if (englishKey) {
                    element.setAttribute('data-original-text', englishKey);
                }
            }
            const englishKey = element.getAttribute('data-original-text');
            if (englishKey) {
                const translatedText = this.__(englishKey);
                element.textContent = translatedText;
            }
        });
    }

    private langSelectAction(): Record<string, string> {
        const activeFlag = document.querySelector('.dropdown-head .flag.active') as HTMLImageElement;
        const passiveButtons = document.querySelectorAll('.dropdown-item button[data-lang]');
        const flagSources: Record<string, string> = {};

        document.querySelectorAll('.flag[data-lang]').forEach(flag => {
            const lang = flag.getAttribute('data-lang');
            const src = flag.getAttribute('src');
            if (lang && src) {
                flagSources[lang] = src;
            }
        });

        const getCookieValue = (name: string): string | null => {
            const cookies = document.cookie.split('; ');
            const cookie = cookies.find(c => c.startsWith(name + '='));
            return cookie ? cookie.split('=')[1] : null;
        };

        const savedLanguage = getCookieValue('language');

        if (savedLanguage && activeFlag && flagSources[savedLanguage]) {
            const currentLang = activeFlag.getAttribute('data-lang');

            if (currentLang !== savedLanguage) {
                if (flagSources[savedLanguage]) {
                    activeFlag.setAttribute('src', flagSources[savedLanguage]);
                    activeFlag.setAttribute('data-lang', savedLanguage);

                    this.loadTranslations().then(() => {
                        this.translateTextElements();
                        document.dispatchEvent(new CustomEvent('LanguageChanged'));
                    });
                }
            }
        }

        passiveButtons.forEach(button => {
            const clone = button.cloneNode(true) as HTMLButtonElement;
            if (button.parentNode) {
                button.parentNode.replaceChild(clone, button);
            }

            clone.addEventListener('click', (e) => {
                e.preventDefault();
                const clickedButton = e.currentTarget as HTMLButtonElement;
                const newLang = clickedButton.getAttribute('data-lang');
                const clickedFlag = clickedButton.querySelector('.flag') as HTMLImageElement;

                if (!newLang || !clickedFlag) return;

                document.cookie = `language=${newLang}; path=/; max-age=31536000`;

                if (activeFlag) {
                    activeFlag.setAttribute('src', clickedFlag.src);
                    activeFlag.setAttribute('data-lang', newLang);

                    this.loadTranslations().then(() => {
                        this.translateTextElements();
                        Router.update();
                        this.closeDropdown();
                        document.dispatchEvent(new CustomEvent('LanguageChanged', {
                            detail: { language: newLang }
                        }));
                    }).catch(error => {
                        console.error('Error loading translations:', error);
                    });
                }
            });
        });

        return flagSources;
    }

    private closeDropdown(): void {
        const dropdown = document.getElementById('language-dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }

    public initialize(): void {
        if (this.isInitialized) {
            return;
        }

        this.isInitialized = true;
        this.loadTranslations();
    }
}