import AbstractView from '../../utils/AbstractView.js';
import { ToggleProps } from '../../interfaces/componentInterfaces.js';

export default class Toggle extends AbstractView {
    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
    }

    async renderToggle({ id, name = '', label = '', checked = false, readonly = false }: ToggleProps): Promise<string> {
        const inputHtml = readonly
            ? `<div
                    id="${id}"
                    class="w-5 h-5 rounded border border-gray-400 flex items-center justify-center
                           ${checked ? 'bg-green-500' : 'bg-white'}"
                >
                    ${checked ? '<div class="w-2 h-2 bg-white rounded-full"></div>' : ''}
                </div>`
            : `<input
                    type="checkbox"
                    id="${id}"
                    name="${name}"
                    ${checked ? 'checked' : ''}
                    value="${checked ? 'on' : ''}"
                    class="w-5 h-5"
                />`;
    
        return this.render(`
            <div class="detail-row">
                <label class="label block mb-1" for="${id}">${label}</label>
                <div id="${id}-toggle-group" class="flex gap-4 items-center">
                    ${inputHtml}
                </div>
            </div>
        `);
    }    
        

    async getHtml(): Promise<string> {
        return await this.renderToggle(
            {
                id: 'default-toggle',
                name: 'defaultToggle',
                label: 'Email Verified',
                checked: false,
            });
    }

    async mountToggle(id: string): Promise<void> {
        const yesBtn = document.getElementById(`${id} -yes`);
        const noBtn = document.getElementById(`${id} -no`);
        const input = document.getElementById(id) as HTMLInputElement; 
    
        if (!yesBtn || !noBtn || !input) return;
    
        const isReadOnly = input.hasAttribute('readonly');
        const isChecked = input.checked;
    
        // Always apply initial visual state based on checked
        if (isChecked) {
            input.value = 'true';
            yesBtn.classList.add('active', 'bg-green-500', 'text-white');
            noBtn.classList.add('text-white/50');
        } else {
            input.value = 'false';
            noBtn.classList.add('active', 'bg-red-500', 'text-white');
            yesBtn.classList.add('text-white/50');
        }
    
        // If readonly, disable interactivity
        if (isReadOnly) {
            yesBtn.classList.add('cursor-not-allowed');
            noBtn.classList.add('cursor-not-allowed');
            return;
        }
    
        // Add listeners only if not readonly
        yesBtn.addEventListener('click', () => {
            console.log('toggleleeeee');
            if (input.readOnly == true) return;
            input.checked = true;
            input.value = 'true';
    
            yesBtn.classList.add('active', 'bg-green-500', 'text-white');
            yesBtn.classList.remove('text-white/50');
            noBtn.classList.remove('active', 'bg-red-500', 'text-white');
            noBtn.classList.add('text-white/50');
        });
    
        noBtn.addEventListener('click', () => {
            if (input.readOnly == true) return;
            input.checked = false;
            input.value = 'false';
    
            noBtn.classList.add('active', 'bg-red-500', 'text-white');
            noBtn.classList.remove('text-white/50');
            yesBtn.classList.remove('active', 'bg-green-500', 'text-white');
            yesBtn.classList.add('text-white/50');
        });
    }
    
    
}
