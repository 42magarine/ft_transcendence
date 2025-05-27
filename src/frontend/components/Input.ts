import AbstractView from '../../utils/AbstractView.js';
import { InputProps } from '../../interfaces/abstractViewInterfaces.js';

export default class Input extends AbstractView
{
	constructor(params: URLSearchParams = new URLSearchParams())
	{
		super(params);
	}

	async renderInput({
		id = '',
		name,
		type = 'text',
		placeholder = '',
		value = '',
		className = '',
		withConfirm = false
	}: InputProps & { withConfirm?: boolean }): Promise<string>
	{
		const finalClass = className || 'input';

		if (type === 'display')
		{
			return this.render(`
				<div class="detail-row">
					<label class="label">${placeholder || name}:</label>
					<span class="value">${value || ''}</span>
				</div>
			`);
		}

		const inputField = type === 'select'
			? `<select name="${name}" id="${id}" class="${finalClass}">${value}</select>`
			: `<input
					type="${type}"
					id="${id}"
					name="${name}"
					placeholder="${placeholder}"
					value="${value}"
					class="${finalClass}"
				/>`;

		let confirmInput = '';
		if (withConfirm && type === 'password')
		{
			confirmInput = `
				<div class="detail-row" id="${id}-confirm-row" style="display: none;">
					<label class="label">Confirm Password:</label>
					<input class="input" type="password" name="${name}Confirm" placeholder="Repeat ${placeholder}" />
				</div>
				<script>
					document.addEventListener('DOMContentLoaded', function () {
						const input = document.getElementById('${id}');
						const confirmRow = document.getElementById('${id}-confirm-row');
						if (input && confirmRow) {
							input.addEventListener('input', () => {
								if (input.value.trim().length > 0) {
									confirmRow.style.display = 'block';
								} else {
									confirmRow.style.display = 'none';
									const confirmInput = confirmRow.querySelector('input[name="${name}Confirm"]');
									if (confirmInput) confirmInput.value = '';
								}
							});
						}
					});
				</script>
			`;
		}
        
		return this.render(`
			<div class="detail-row">
            <label class="label">${placeholder || name}:</label>
            ${inputField}
			</div>
			${confirmInput}
            `);
        }


	async getHtml(): Promise<string>
	{
		return this.render(`<input placeholder="Default Input" />`);
	}
}
