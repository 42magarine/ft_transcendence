import AbstractView from '../../utils/AbstractView.js';
import { themedCard, themedInput, themedBtn, ThemeName } from '../theme/themeHelpers.js';

interface InputField {
	name: string;
	type?: string;
	placeholder?: string;
	value?: string;
}

interface CardButton {
	text: string;
	type: string;
	className?: string;
}

type ContentBlock =
	| { type: 'input'; props: InputField }
	| { type: 'label'; props: { htmlFor: string; text: string } }
	| { type: 'stat'; props: { label: string; value: string } }
	| { type: 'toggle'; props: { name: string; checked?: boolean; label?: string } }
	| { type: 'toolbar'; props: { buttons: { text: string; onClick: string }[] } };

interface CardProps {
	title?: string;
	footer?: string;
	className?: string;
	body?: string;
	inputs?: InputField[];
	button?: CardButton;
	formId?: string;
	extra?: string;
	contentBlocks?: ContentBlock[];
	theme?: string;
}

interface CardGroupProps {
	cards: CardProps[];
	layout?: 'stack' | 'grid' | 'flex';
	className?: string;
	theme?: string;
}

export default class Card extends AbstractView {
	private theme: ThemeName;

	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.theme = (params.get('theme') || this.props.theme || 'default') as ThemeName;
	}

	private renderContentBlock(block: ContentBlock): string {
		switch (block.type) {
			case 'input': {
				const { name, type = 'text', placeholder = '', value = '' } = block.props;
				return `<input
					type="${type}"
					name="${name}"
					value="${value}"
					placeholder="${placeholder}"
					required
					class="${themedInput(this.theme)}"
				/>`;
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
					.map(btn =>
						`<button onclick="${btn.onClick}" class="${themedBtn(this.theme)} btn-sm btn-secondary">${btn.text}</button>`
					)
					.join('')}</div>`;

			default:
				return '';
		}
	}

	async renderCard({
		title = '',
		footer = '',
		className = '',
		body = '',
		inputs = [],
		button,
		formId,
		extra = '',
		contentBlocks = [],
		theme = this.theme,
	}: CardProps): Promise<string> {
		const titleHtml = title
			? `<div class="card-header px-6 pt-6 py-2 text-center">
					<h3 class="text-xl font-bold text-white mb-2">${title}</h3>
				</div>`
			: '';

		const footerHtml = footer
			? `<div class="card-footer px-6 pt-4 pb-6">${footer}</div>`
			: '';

		const inputsHtml = inputs
			.map(input => this.renderContentBlock({ type: 'input', props: input }))
			.join('\n');

		const extraContentHtml = contentBlocks.map(block => this.renderContentBlock(block)).join('\n');

		const formHtml =
			inputs.length || button || extra
				? `<form id="${formId || ''}">
					<div class="flex flex-col gap-4">
					${inputsHtml}
					${
						button
						? `<button type="${button.type}" class="${button.className || themedBtn(this.theme)}">${button.text}</button>`
						: ''
					}
					${extra}
					</div>
				</form>`
				: '';


		const bodyContent = [formHtml || body, extraContentHtml].filter(Boolean).join('\n');

		return this.render(`
			<div class="${themedCard(this.theme)} ${className}">
				${titleHtml}
				<div class="card-body px-6 py-4">
					${bodyContent}
				</div>
				${footerHtml}
			</div>
		`);
	}

	async renderGroup({
		cards,
		layout = 'grid',
		className = '',
		theme = this.theme,
	}: CardGroupProps): Promise<string> {
		const layoutClassMap: Record<string, string> = {
			stack: 'card-group flex flex-col gap-6',
			grid: 'card-group grid grid-cols-1 sm:grid-cols-2 gap-6',
			flex: 'card-group flex flex-wrap gap-6',
		};

		const wrapperClass = `${layoutClassMap[layout]} ${className}`;

		const renderedCards = await Promise.all(
			cards.map(config => this.renderCard({ ...config, theme }))
		);

		return this.render(`
			<div class="${wrapperClass}">
				${renderedCards.join('\n')}
			</div>
		`);
	}

	async getHtml(): Promise<string> {
		return this.render(`<div class="${themedCard(this.theme)}">No content</div>`);
	}
}
