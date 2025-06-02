import AbstractView from '../../utils/AbstractView.js';
import { ToggleProps } from '../../interfaces/componentInterfaces.js';

export default class Toggle extends AbstractView
{
	constructor(params: URLSearchParams = new URLSearchParams())
	{
		super(params);
	}

	async renderToggle({ id, name = '', label = '', checked = false, readonly = false }: ToggleProps): Promise<string>
	{
		return this.render(`
			<div class="detail-row">
				<label class="label block mb-1" for="${id}">${label}</label>
				<div id="${id}-toggle-group" class="flex gap-4">
					<button type="button" id="${id}-yes"
						class="toggle-btn px-4 py-1 rounded-full border border-black text-sm font-semibold ${checked ? 'active bg-green-500 text-white' : ''}"
						${readonly ? 'disabled' : ''}>
						<i class="fas fa-check"></i>
					</button>
					<button type="button" id="${id}-no"
						class="toggle-btn px-4 py-1 rounded-full border border-black  text-sm font-semibold ${!checked ? 'active bg-red-500 text-white' : ''}"
						${readonly ? 'disabled' : ''}>
					<i class="fas fa-times"></i>
					</button>
					${!readonly ? `<input type="hidden" id="${id}" name="${name}" value="${checked ? 'true' : 'false'}" />` : ''}
				</div>
			</div>
		`);
	}

	async getHtml(): Promise<string>
	{
		return await this.renderToggle(
		{
			id: 'default-toggle',
			name: 'defaultToggle',
			label: 'Email Verified',
			checked: false
		});
	}

	async mountToggle(id: string): Promise<void>
	{
		const yesBtn = document.getElementById(`${id}-yes`);
		const noBtn = document.getElementById(`${id}-no`);
		const input = document.getElementById(id) as HTMLInputElement;

		if (!yesBtn || !noBtn || !input)
		{
			//console.warn(`[Toggle] Missing elements for toggle ID: ${id}`);
			return;
		}

		yesBtn.addEventListener('click', () =>
			{
				input.value = 'true';
			
				yesBtn.classList.add('active', 'bg-green-500', 'text-white');
				noBtn.classList.remove('active', 'bg-red-500', 'text-white');
			
				noBtn.classList.add('text-white/50');
			});
			
			noBtn.addEventListener('click', () =>
			{
				input.value = 'false';
			
				noBtn.classList.add('active', 'bg-red-500', 'text-white');
				yesBtn.classList.remove('active', 'bg-green-500', 'text-white');
			
				yesBtn.classList.add('text-white/50');
			});
	}
}
