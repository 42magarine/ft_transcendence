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

        elementsToTranslate.forEach(element => {
            if (!element.getAttribute('data-original-text')) {
                const originalText = element.textContent?.trim();
                if (originalText) {
                    element.setAttribute('data-original-text', originalText);
                }
            }

            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                const translatedText = this.__(originalText);
                element.textContent = translatedText;
            }
        });
    }

    private langSelectAction(): Record<string, string> {
        const activeFlag = document.querySelector('.active[data-lang]') as HTMLImageElement;
        const passiveFlags = document.querySelectorAll('.passive[data-lang]');
        const flagSources: Record<string, string> = {};

        document.querySelectorAll('[data-lang]').forEach(flag => {
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
                const passiveFlagWithSavedLang = Array.from(passiveFlags).find(
                    flag => flag.getAttribute('data-lang') === savedLanguage
                ) as HTMLImageElement | undefined;

                if (passiveFlagWithSavedLang) {
                    const passiveSrc = passiveFlagWithSavedLang.getAttribute('src');
                    const passiveLang = passiveFlagWithSavedLang.getAttribute('data-lang');
                    const activeSrc = activeFlag.getAttribute('src');
                    const activeLang = activeFlag.getAttribute('data-lang');

                    if (passiveSrc && passiveLang && activeSrc && activeLang) {
                        activeFlag.setAttribute('src', passiveSrc);
                        activeFlag.setAttribute('data-lang', passiveLang);
                        passiveFlagWithSavedLang.setAttribute('src', activeSrc);
                        passiveFlagWithSavedLang.setAttribute('data-lang', activeLang);

                        this.loadTranslations().then(() => {
                            this.translateTextElements();
                            document.dispatchEvent(new CustomEvent('LanguageChanged'));
                        });
                    }
                }
            }
        }

        passiveFlags.forEach(passiveFlag => {
            const clone = passiveFlag.cloneNode(true) as HTMLImageElement;
            if (passiveFlag.parentNode) {
                passiveFlag.parentNode.replaceChild(clone, passiveFlag);
            }

            clone.addEventListener('click', (e) => {
                const clickedFlag = e.target as HTMLImageElement;
                const newLang = clickedFlag.getAttribute('data-lang');

                if (!newLang) return;

                document.cookie = `language=${newLang}; path=/; max-age=31536000`;

                if (activeFlag) {
                    const oldActiveLang = activeFlag.getAttribute('data-lang');
                    const oldActiveSrc = activeFlag.getAttribute('src');

                    activeFlag.setAttribute('src', clickedFlag.src);
                    activeFlag.setAttribute('data-lang', newLang);

                    if (oldActiveLang && oldActiveSrc) {
                        clickedFlag.setAttribute('src', oldActiveSrc);
                        clickedFlag.setAttribute('data-lang', oldActiveLang);
                    }

                    this.loadTranslations().then(() => {
                        this.translateTextElements();
                        Router.update();
                    });
                }
            });
        });

        return flagSources;
    }

    public initialize(): void {
        if (this.isInitialized) {
            return;
        }

        this.isInitialized = true;
        this.loadTranslations();
    }
}