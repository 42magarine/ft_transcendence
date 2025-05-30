import AbstractView from '../../utils/AbstractView.js';
import Button from './Button.js';
import { ButtonProps, ModalProps } from '../../interfaces/abstractViewInterfaces.js';



export default class Modal extends AbstractView
{
	constructor(params: URLSearchParams = new URLSearchParams())
	{
		super(params);
	}

	async renderModal({
		id,
		title = '',
		content,
		footer = '',
		footerButtons = [], // added
		showCloseButton = true,
		animation = 'fade',
		closableOnOutsideClick = true,
	}: ModalProps): Promise<string>
	{
		const animationClass = {
			fade: 'opacity-0 pointer-events-none transition-opacity duration-200',
			scale: 'scale-95 opacity-0 pointer-events-none transition-all duration-200',
			none: ''
		}[animation];

		const animationDataAttr = animation !== 'none' ? `data-animation="${animation}"` : '';
		const closableAttr = closableOnOutsideClick ? `data-close-on-outside="true"` : '';

		let footerHtml = footer;

		if (footerButtons.length > 0)
		{
			const buttonRenderer = new Button();
			const buttonGroupHtml = await buttonRenderer.renderButtonGroup({
				buttons: footerButtons,
				align: 'right',
				layout: 'group'
			});
			footerHtml += `<div class="mt-4">${buttonGroupHtml}</div>`;
		}

		return this.render(`
			<div
				id="${id}"
				class="fixed inset-0 z-50 bg-black/50 flex justify-center items-center hidden"
				${animationDataAttr} ${closableAttr}
				onclick="handleModalOutsideClick(event, '${id}')"
			>
				<div
					class="bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg shadow-lg w-[90%] max-w-md p-6 relative"
					onclick="event.stopPropagation();"
				>
					${showCloseButton ? `
						<button onclick="document.getElementById('${id}').classList.add('hidden')"
							class="absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-xl font-bold">&times;</button>
					` : ''}

					${title ? `<h2 class="text-2xl font-semibold mb-4">${title}</h2>` : ''}

					<div class="modal-content text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-4">
						${content}
					</div>

					${footerHtml ? `<div class="modal-footer mt-4">${footerHtml}</div>` : ''}
				</div>
			</div>
		`);
	}
    async getHtml(): Promise<string>
{
	return this.renderModal({
		id: 'default-modal',
		title: 'Example Modal',
		content: '<p>This is a default modal.</p>',
		footerButtons: [
			{
				id: 'close-btn',
				text: 'Close',
				className: 'btn btn-secondary',
				onClick: `document.getElementById('default-modal').classList.add('hidden')`
			}
		],
		animation: 'scale',
		closableOnOutsideClick: true
	});
}

}
