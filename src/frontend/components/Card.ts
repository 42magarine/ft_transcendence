import AbstractView from '../../utils/AbstractView.js';
import { InputField, CardButton, CardProps, CardGroupProps, ContentBlock } from '../../interfaces/abstractViewInterfaces.js';
import Table from './Table.js';

export default class Card extends AbstractView
{
	private contextData: Record<string, any> = {};

	constructor(params: URLSearchParams = new URLSearchParams())
	{
		super(params);
	}

	setContextData(data: Record<string, any>): void
	{
		this.contextData = { ...this.contextData, ...data };
	}

	private renderContentBlock(block: ContentBlock): string
	{
		switch (block.type)
		{
			case 'input': {
				const {
					name,
					type = 'text',
					placeholder = '',
					value = '',
					options = [],
					min = undefined,
					max = undefined,
					step = undefined,
					className = ''
				} = block.props;

				if (type === 'select')
				{
					return `<select name="${name}" class="p-2 ${className}" required>
						<option value="" disabled selected>${placeholder}</option>
						${options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
					</select>`;
				}

				if (type === 'file')
				{
					return `<div class="flex flex-col">
						<label for="${name}" class="text-sm font-medium text-white/90">${placeholder}</label>
						<input type="file" id="${name}" name="${name}" class="file-input file-input-bordered w-full ${className}" />
					</div>`;
				}

				if (type === 'checkbox')
				{
					return `<div class="flex items-center gap-2">
						<input type="checkbox" id="${name}" name="${name}" class="${className}" />
						<label for="${name}" class="text-sm font-medium text-white/90">${placeholder}</label>
					</div>`;
				}

				if (type === 'number')
				{
					return `<input type="number" id="${name}" name="${name}" value="${value}" placeholder="${placeholder}"
						${min !== undefined ? `min="${min}"` : ''} ${max !== undefined ? `max="${max}"` : ''} ${step !== undefined ? `step="${step}"` : ''}
						class="${className}" required />`;
				}

				if (type === 'hidden')
				{
					return `<input type="hidden" name="${name}" value="${value}" id="${name}" />`;
				}

				return `<input type="${type}" id="${name}" name="${name}" value="${value}" placeholder="${placeholder}" required class="${className}" />`;
			}
			case 'label':
				return `<label for="${block.props.htmlFor}" class="text-sm font-medium text-white/90">${block.props.text}</label>`;

			case 'stat':
				return `<div class="stat">
					<div class="stat-title text-white/70">${block.props.label}</div>
					<div class="stat-value text-white">${block.props.value}</div>
				</div>`;

			case 'toggle':
				return `<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" name="${block.props.name}" ${block.props.checked ? 'checked' : ''} class="toggle" />
					<span class="text-white text-sm">${block.props.label || ''}</span>
				</label>`;

			case 'toolbar':
				return `<div class="flex gap-2">${block.props.buttons
					.map(btn => `<button onclick="${btn.onClick}" class="btn-sm btn-secondary">${btn.text}</button>`)
					.join('')}</div>`;

			default:
				return '';
		}
	}

	async renderCard({
		title = '',
		footer = '',
		className = 'card',
		body = '',
		inputs = [],
		button,
		formId,
		extra = '',
		prefix = '',
		preButton = '',
		contentBlocks = [],
		data = {},
		table = undefined
	}: CardProps): Promise<string>
	{
		const titleHtml = title
			? `<div class="card-header px-6 pt-6 py-2 text-center">
					<h3 class="text-xl font-bold text-white mb-2">${title}</h3>
				</div>`
			: '';

		const footerHtml = footer
			? `<div class="card-footer px-6 pt-4 pb-6">${footer}</div>`
			: '';

		const inputBlocks = inputs.map(input => ({
			type: 'input' as const,
			props: input
		}));

		const inputsHtml = inputBlocks.map(block => this.renderContentBlock(block)).join('\n');
		const extraContentHtml = contentBlocks.map(block => this.renderContentBlock(block)).join('\n');
		const preButtonHtml = preButton ? `<div class="mb-4">${preButton}</div>` : '';
		const prefixHtml = prefix ? `<div class="mb-4">${prefix}</div>` : '';

		const formHtml = inputs.length || button || extra
			? `<form id="${formId || ''}" enctype="multipart/form-data">
					${prefixHtml}
					<div class="flex flex-col gap-4">
						${inputsHtml}
						${preButtonHtml}
						${button
				? `<button type="${button.type}" class="${button.className}">${button.text}</button>`
				: ''}
						${extra}
					</div>
				</form>`
			: '';

		let tableHtml = '';
		if (table)
		{
			const tableComponent = new Table();
			tableHtml = await tableComponent.renderTable(table);
		}

		const bodyContent = [formHtml || body, extraContentHtml, tableHtml].filter(Boolean).join('\n');

		const mergedData = { ...this.contextData, ...data };

		return this.render(`
			<div class="${className}">
				${titleHtml}
				<div class="card-body px-6 py-4">
					${bodyContent}
				</div>
				${footerHtml}
			</div>
		`, mergedData);
	}

	async renderGroup({
		cards,
		layout = 'grid',
		className = 'card',
		data = {},
	}: CardGroupProps): Promise<string>
	{
		const layoutClassMap: Record<string, string> = {
			stack: 'card-group flex flex-col gap-6',
			grid: 'card-group grid grid-cols-1 sm:grid-cols-2 gap-6',
			flex: 'card-group flex flex-wrap gap-6',
		};

		const wrapperClass = `${layoutClassMap[layout]} ${className}`;
		const mergedData = { ...this.contextData, ...data };

		const renderedCards = await Promise.all(
			cards.map(config => this.renderCard({
				...config,
				data: mergedData,
			}))
		);

		return this.render(`
			<div class="${wrapperClass}">
				${renderedCards.join('\n')}
			</div>
		`, mergedData);
	}

	async getHtml(): Promise<string>
	{
		return this.render(`<div class="">No content</div>`, this.contextData);
	}
}
