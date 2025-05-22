import Router from '../../utils/Router.js';

export class LanguageService {
    private static translations: Record<string, Record<string, string>> = {};
    private static isInitialized: boolean = false;

    static async loadTranslations() {
        try {
            const httpProtocol = window.location.protocol;
            const response = await fetch(`${httpProtocol}//${window.location.host}/dist/assets/languages/translation.json`);
            LanguageService.translations = await response.json();
        }
        catch (error) {
            console.error('Failed to load translations:', error);
        }
    }

    static __(key: string): string {
        const currentLanguage = LanguageService.getCurrentLanguage?.() || 'en_EN';

        const keys = Object.keys(LanguageService.translations);
        for (const k of keys) {
            const translationObjU = LanguageService.translations[k] as unknown;
            const translationObj = translationObjU as Record<string, Record<string, string>>;

            if (key in translationObj) {
                const translation = translationObj[key][currentLanguage];
                return translation || key;
            }
        }

        if (key in LanguageService.translations) {
            const translation = LanguageService.translations[key][currentLanguage];
            return translation || key;
        }

        return key;
    }

    static getCurrentLanguage(): string {
        const langCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('language='));

        return langCookie ? langCookie.split('=')[1] : 'en';
    }

    static setupLangSelect() {
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

                        LanguageService.loadTranslations().then(() => {
                            document.dispatchEvent(new CustomEvent('LanguageChanged'));
                        });
                    }
                }
            }
        }

        passiveFlags.forEach(passiveFlag => {
            const clone = passiveFlag.cloneNode(true);
            if (passiveFlag.parentNode) {
                passiveFlag.parentNode.replaceChild(clone, passiveFlag);
            }

            clone.addEventListener('click', function (e) {
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
                    LanguageService.loadTranslations().then(() => {
                        Router.update()
                    });
                }
            });
        });

        return flagSources;
    }

    static initialize() {
        if (this.isInitialized) {
            return;
        }

        this.isInitialized = true;
        this.loadTranslations();

        const routerContentLoadedHandler = () => {
            LanguageService.setupLangSelect();
            document.removeEventListener('RouterContentLoaded', routerContentLoadedHandler);
        };

        document.addEventListener('RouterContentLoaded', routerContentLoadedHandler);
    }
}

const __ = LanguageService.__;
export default __;

LanguageService.initialize();
