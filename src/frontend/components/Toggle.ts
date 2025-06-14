import AbstractView from '../../utils/AbstractView.js';
import { ToggleProps } from '../../interfaces/componentInterfaces.js';

export default class Toggle extends AbstractView {
    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
    }

    async renderToggle({ id, name = '', label = '', checked = false, readonly = false }: ToggleProps): Promise<string> {
        return this.render(`
			<div class="detail-row">
				<label class="label block mb-1" for="${id}">${label}</label>
				<div id="${id}-toggle-group" class="flex gap-4">
					<input type="checkbox" id="${id}" name="${name}" ${checked ? 'checked' : ''} value = "${checked ? 'on' : ''}" />
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
                checked: false
            });
    }

    async mountToggle(id: string): Promise<void> {
        const yesBtn = document.getElementById(`${id} -yes`);
        const noBtn = document.getElementById(`${id} -no`);
        const input = document.getElementById(id) as HTMLInputElement;

        if (!yesBtn || !noBtn || !input) {
            //console.warn(`[Toggle] Missing elements for toggle ID: ${ id } `);
            return;
        }

        yesBtn.addEventListener('click', () => {
            input.value = 'true';

            yesBtn.classList.add('active', 'bg-green-500', 'text-white');
            noBtn.classList.remove('active', 'bg-red-500', 'text-white');

            noBtn.classList.add('text-white/50');
        });

        noBtn.addEventListener('click', () => {
            input.value = 'false';

            noBtn.classList.add('active', 'bg-red-500', 'text-white');
            yesBtn.classList.remove('active', 'bg-green-500', 'text-white');

            yesBtn.classList.add('text-white/50');
        });
    }
}
