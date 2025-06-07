import AbstractView from '../../utils/AbstractView.js';
import Button from './Button.js';
import type { ButtonProps, ModalProps } from '../../interfaces/componentInterfaces.js';

export default class Modal extends AbstractView {
    constructor(params: URLSearchParams = new URLSearchParams()) {
        super(params);
    }

    private async renderFooter(footer: string, footerButtons: ButtonProps[]): Promise<string> {
        let footerHtml = footer;

        if (footerButtons.length > 0) {
            const buttonRenderer = new Button();
            const buttonGroupHtml = await buttonRenderer.renderButtonGroup({
                buttons: footerButtons,
                align: 'right',
                layout: 'group'
            });
            footerHtml += `<div class="mt-4">${buttonGroupHtml}</div>`;
        }

        return footerHtml ? `<div class="modal-footer mt-4">${footerHtml}</div>` : '';
    }

    private renderCloseButton(id: string): string {
        return `
			<button
				class="absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-xl font-bold"
				aria-label="Close modal"
				onclick="document.getElementById('${id}').classList.add('hidden')"
			>&times;</button>
		`;
    }

    async renderModal({
        id,
        title = '',
        content,
        footer = '',
        footerButtons = [],
        showCloseButton = true,
        closableOnOutsideClick = true
    }: ModalProps): Promise<string> {
        const closableAttr = closableOnOutsideClick ? `data-close-on-outside="true"` : '';
        const footerHtml = await this.renderFooter(footer, footerButtons);

        return this.render(`
			<div
				id="${id}"
				class="fixed inset-0 z-50 bg-black/50 flex justify-center items-center hidden"
				${closableAttr}
				onclick="window.handleModalOutsideClick(event, '${id}')"
			>
				<div
					class="dark:bg-gray-800 text-black dark:text-white rounded-lg shadow-lg w-[90%] max-w-md p-6 relative"
					onclick="event.stopPropagation();"
				>
					${showCloseButton ? this.renderCloseButton(id) : ''}
					${title ? `<h2 class="text-2xl font-semibold mb-4">${title}</h2>` : ''}
					<div class="modal-content text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-4">
						${content}
					</div>
					${footerHtml}
				</div>
			</div>
		`);
    }

    async renderDeleteModal({
        id,
        userId,
        onConfirm
    }: {
        id: string;
        userId: string;
        onConfirm: () => Promise<void>;
    }): Promise<void> {
        const modalHtml = await this.renderModal({
            id,
            title: 'Confirm Deletion',
            content: `<p>Are you sure you want to delete this user?<br><strong>This action cannot be undone.</strong></p>`,
            footerButtons: [
                {
                    id: 'cancel-delete-btn',
                    text: 'Cancel',
                    className: 'btn btn-secondary',
                    onClick: `document.getElementById('${id}').classList.add('hidden')`
                },
                {
                    id: 'confirm-delete-btn',
                    text: 'Yes, Delete',
                    className: 'btn btn-red'
                }
            ],
            closableOnOutsideClick: true
        });

        const container = document.createElement('div');
        container.innerHTML = modalHtml;
        document.body.appendChild(container);

        document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
            await onConfirm();
            document.getElementById(id)?.classList.add('hidden');
        });

        document.getElementById('cancel-delete-btn')?.addEventListener('click', () => {
            document.getElementById(id)?.classList.add('hidden');
        });
    }

    async renderRemoveFriendModal({
        id,
        friendId,
        onConfirm
    }: {
        id: string;
        friendId: number;
        onConfirm: () => Promise<void>;
    }): Promise<void> {
        const modalHtml = await this.renderModal({
            id,
            title: 'Remove Friend',
            content: `<p>Do you really want to remove this friend?<br><strong>This action cannot be undone.</strong></p>`,
            footerButtons: [
                {
                    id: 'cancel-remove-btn',
                    text: 'Cancel',
                    className: 'btn btn-secondary',
                    onClick: `document.getElementById('${id}').classList.add('hidden')`
                },
                {
                    id: 'confirm-remove-btn',
                    text: 'Remove',
                    className: 'btn btn-red'
                }
            ],
            closableOnOutsideClick: true
        });

        const container = document.createElement('div');
        container.innerHTML = modalHtml;
        document.body.appendChild(container);

        document.getElementById('confirm-remove-btn')?.addEventListener('click', async () => {
            await onConfirm();
            document.getElementById(id)?.classList.add('hidden');
        });

        document.getElementById('cancel-remove-btn')?.addEventListener('click', () => {
            document.getElementById(id)?.classList.add('hidden');
        });
    }

    async renderInfoModal({
        id,
        title = 'Notice',
        message = 'Something important you should know.'
    }: {
        id: string;
        title?: string;
        message?: string;
    }): Promise<void> {
        const modalHtml = await this.renderModal({
            id,
            title,
            content: `<p class="text-yellow-300">${message}</p>`,
            footerButtons: [],
            closableOnOutsideClick: true,
            showCloseButton: false
        });

        const container = document.createElement('div');
        container.innerHTML = modalHtml;
        document.body.appendChild(container);

        document.getElementById(id)?.classList.remove('hidden');
    }

    async mountDeleteModal(modalId: string): Promise<void> {
        const modal = document.getElementById(modalId);
        if (!modal) throw new Error(`Modal with ID ${modalId} not found`);
        modal.classList.remove('hidden');
    }

    async getHtml(): Promise<string> {
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
            closableOnOutsideClick: true
        });
    }
}
