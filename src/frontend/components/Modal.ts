import AbstractView from '../../utils/AbstractView.js';

interface ModalProps {
    id: string;
    title?: string;
    content: string;
    footer?: string;
    showCloseButton?: boolean;
    animation?: 'fade' | 'scale' | 'none';
    closableOnOutsideClick?: boolean;
}

export default class Modal extends AbstractView {
    constructor(params: URLSearchParams = new URLSearchParams()) {
        super(params);
    }

    async renderModal({
        id,
        title = '',
        content,
        footer = '',
        showCloseButton = true,
        animation = 'fade',
        closableOnOutsideClick = true,
    }: ModalProps): Promise<string> {
        const animationClass = {
            fade: 'transition-opacity duration-200 ease-out opacity-0 invisible',
            scale: 'transform scale-95 opacity-0 transition duration-200 ease-out',
            none: '',
        }[animation];

        const animationDataAttr = animation !== 'none' ? `data-animation="${animation}"` : '';
        const closableAttr = closableOnOutsideClick ? `data-close-on-outside="true"` : '';

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
					${title ? `<h2 class="text-2xl font-bold mb-4">${title}</h2>` : ''}
					<div class="modal-content">
						${content}
					</div>
					${footer ? `<div class="modal-footer mt-6">${footer}</div>` : ''}
				</div>
			</div>
		`);
    }

    async getHtml(): Promise<string> {
        return this.renderModal({
            id: 'defaultModal',
            title: 'Example Modal',
            content: '<p>This is a reusable modal!</p>',
            footer: `
				<button class="bg-gray-500 text-white px-4 py-2 rounded" onclick="document.getElementById('defaultModal').classList.add('hidden')">Close</button>
			`,
            animation: 'scale',
            closableOnOutsideClick: true,
        });
    }
}
