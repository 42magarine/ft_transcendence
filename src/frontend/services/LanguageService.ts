import Router from "../../utils/Router.js";

export default class LanguageService {
    private isInitialized: boolean = false;
    private translations: Record<string, Record<string, string>> = {};
    private hasBoundLangListeners = false;

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
        // this tells you if something got no translation yet!
        if (currentLanguage !== "en_EN") {
            //console.log("(づ ◕‿◕ )づ  " + key)
        }
        return key;
    }

    private getCurrentLanguage(): string {
        const langCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('language='));

        return langCookie ? langCookie.split('=')[1] : 'en_EN';
    }

    private updateHtmlLangAttribute(): void {
        const currentLanguage = this.getCurrentLanguage();
        const htmlElement = document.documentElement;

        const htmlLang = currentLanguage.split('_')[0];
        htmlElement.setAttribute('lang', htmlLang);
    }

    private translateTextElements(): void {
        const elementsToTranslate = document.querySelectorAll('.__');
        elementsToTranslate.forEach((element) => {
            if (!element.getAttribute('data-original-text')) {
                const currentText = element.textContent?.trim();
                if (currentText) {
                    const englishKey = this.findEnglishKeyByTranslation(currentText);
                    if (englishKey) {
                        element.setAttribute('data-original-text', englishKey);
                    } else {
                        element.setAttribute('data-original-text', currentText);
                    }
                }
            }

            const englishKey = element.getAttribute('data-original-text');
            if (englishKey) {
                const translatedText = this.__(englishKey);
                element.textContent = translatedText;
            }
        });

        // HTML lang-Attribut nach dem Übersetzen aktualisieren
        this.updateHtmlLangAttribute();
    }

    private findEnglishKeyByTranslation(translatedText: string): string | null {
        const currentLanguage = this.getCurrentLanguage() || 'en_EN';

        for (const key of Object.keys(this.translations)) {
            const translationObj = this.translations[key];

            if (translationObj[currentLanguage] === translatedText) {
                return translationObj['en_EN'] || key;
            }

            if (typeof translationObj === 'object') {
                for (const nestedKey of Object.keys(translationObj)) {
                    const nestedTranslation = translationObj[nestedKey];
                    if (typeof nestedTranslation === 'object' &&
                        nestedTranslation[currentLanguage] === translatedText) {
                        return nestedTranslation['en_EN'] || nestedKey;
                    }
                }
            }
        }

        return null;
    }

    public langSelectAction(): Record<string, string> {
        const activeFlag = document.querySelector('.dropdown-head .flag.active') as HTMLImageElement;
        const passiveButtons = document.querySelectorAll('.dropdown-item button[data-lang]');
        const flagSources: Record<string, string> = {};
        const mobileFlags = document.querySelectorAll(".mobilemenu .flag");

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
                    });
                }
            }
        }
        mobileFlags.forEach(mobileButton => {
            mobileButton.addEventListener('click', (e) => {
                e.preventDefault();
                const clickedButton = e.currentTarget as HTMLButtonElement;
                const newLang = clickedButton.getAttribute('data-lang');
                if (!newLang) return;

                document.cookie = `language=${newLang}; path=/; max-age=31536000`;
                this.loadTranslations().then(() => {
                    this.translateTextElements();
                    Router.update();
                }).catch(error => {
                    console.error('Error loading translations:', error);
                });
            });
        })
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
        this.loadTranslations().then(() => {
            this.updateHtmlLangAttribute();
        });
    }
}