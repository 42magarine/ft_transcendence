import Router from '../../utils/Router.js';

export class AccessibilityService {
    private static textSize: string = 'normal-textSize';
    private static contrast: string = 'normal-contrast';

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

        document.cookie = `accessibility_contrast=${this.contrast}; path=/; max-age=31536000`; // 1 year
        document.cookie = `accessibility_text_size=${this.textSize}; path=/; max-age=31536000`; // 1 year
    }

    static setupAccessibilitySwitches() {
        const contrastSwitch = document.getElementById('contrastSwitch') as HTMLImageElement;
        const textsizeSwitch = document.getElementById('textsizeSwitch') as HTMLImageElement;

        if (!contrastSwitch || !textsizeSwitch) {
            console.warn('Accessibility switches not found in DOM');
            return;
        }

        const getCookieValue = (name: string): string | null => {
            const cookies = document.cookie.split('; ');
            const cookie = cookies.find(c => c.startsWith(name + '='));
            return cookie ? cookie.split('=')[1] : null;
        };

        this.textSize = getCookieValue('accessibility_text_size') || 'normal-textSize';
        this.contrast = getCookieValue('accessibility_contrast') || 'normal-contrast';

        this.applyAccessibilities();

        contrastSwitch.addEventListener('click', (e) => {
            if (this.contrast === 'normal-contrast') {
                this.contrast = 'high-contrast';
            } else {
                this.contrast = 'normal-contrast';
            }
            this.applyAccessibilities();
        });

        textsizeSwitch.addEventListener('click', (e) => {
            if (this.textSize === 'normal-textSize') {
                this.textSize = 'big-textSize';
            } else if (this.textSize === 'big-textSize') {
                this.textSize = 'huge-textSize'; // Fixed: was "huge-contrast"
            } else {
                this.textSize = 'normal-textSize';
            }
            this.applyAccessibilities();
        });
    }

    static initialize() {
        this.setupAccessibilitySwitches();
    }
}

AccessibilityService.initialize();