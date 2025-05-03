import AbstractView from '../../utils/AbstractView.js';

interface InputField {
    name: string;
    type: string;
    placeholder?: string;
    value?: string;
    options?: Array<{ value: string, label: string }>; // For select inputs
    min?: number;         // For number inputs
    max?: number;         // For number inputs
    step?: number;        // For number inputs
    className?: string;   // Added className for custom styling
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
    prefix?: string; // Added prefix property
    contentBlocks?: ContentBlock[];
    data?: Record<string, any>;
}

interface CardGroupProps {
    cards: CardProps[];
    layout?: 'stack' | 'grid' | 'flex';
    className?: string;
    data?: Record<string, any>;
}

export default class Card extends AbstractView {
    private contextData: Record<string, any> = {};

    constructor(params: URLSearchParams = new URLSearchParams()) {
        super(params);
    }

    setContextData(data: Record<string, any>): void {
        this.contextData = { ...this.contextData, ...data };
    }

    private renderContentBlock(block: ContentBlock): string {
        switch (block.type) {
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

                // Handle different input types
                if (type === 'select') {
                    return `<select
                        name="${name}"
                        class="p-2 ${className}"
                        required
                    >
                        <option value="" disabled selected>${placeholder}</option>
                        ${options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>`;
                }

                if (type === 'file') {
                    return `<div class="flex flex-col">
                        <label for="${name}" class="text-sm font-medium text-white/90 mb-1">${placeholder}</label>
                        <input
                            type="${type}"
                            id="${name}"
                            name="${name}"
                            class="file-input file-input-bordered w-full ${className}"
                        />
                    </div>`;
                }

                if (type === 'checkbox') {
                    return `<div class="flex">
                        <input
                            type="${type}"
                            id="${name}"
                            name="${name}"
                            class="${className}"
                        />
                        <label for="${name}" class="text-sm font-medium text-white/90 mb-1">${placeholder}</label>
                    </div>`;
                }

                if (type === 'number') {
                    return `<input
                        type="${type}"
                        id="${name}"
                        name="${name}"
                        value="${value}"
                        placeholder="${placeholder}"
                        ${min !== undefined ? `min="${min}"` : ''}
                        ${max !== undefined ? `max="${max}"` : ''}
                        ${step !== undefined ? `step="${step}"` : ''}
                        class="${className}"
                        required
                    />`;
                }

                if (type === 'hidden') {
                    return `<input
                        type="${type}"
                        name="${name}"
                        value="${value}"
                        id="${name}"
                    />`;
                }

                return `<input
                    type="${type}"
                    id="${name}"
                    name="${name}"
                    value="${value}"
                    placeholder="${placeholder}"
                    required
                    class="${className}"
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
                        `<button onclick="${btn.onClick}" class="btn-sm btn-secondary">${btn.text}</button>`
                    )
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
        contentBlocks = [],
        data = {},
    }: CardProps): Promise<string> {
        const titleHtml = title
            ? `<div class="card-header px-6 pt-6 py-2 text-center">
                    <h3 class="text-xl font-bold text-white mb-2">${title}</h3>
                </div>`
            : '';

        const footerHtml = footer
            ? `<div class="card-footer px-6 pt-4 pb-6">${footer}</div>`
            : '';

        // Map inputs to content blocks
        const inputBlocks = inputs.map(input => ({
            type: 'input' as const,
            props: input
        }));

        // Render all input blocks
        const inputsHtml = inputBlocks
            .map(block => this.renderContentBlock(block))
            .join('\n');

        const extraContentHtml = contentBlocks.map(block => this.renderContentBlock(block)).join('\n');

        // Include prefix if provided
        const prefixHtml = prefix ? `<div class="mb-4">${prefix}</div>` : '';

        const formHtml =
            inputs.length || button || extra
                ? `<form id="${formId || ''}" enctype="multipart/form-data">
                    ${prefixHtml}
                    <div class="flex flex-col gap-4">
                    ${inputsHtml}
                    ${button
                    ? `<button type="${button.type}" class="${button.className}">${button.text}</button>`
                    : ''}
                    ${extra}
                    </div>
                </form>`
                : '';

        const bodyContent = [formHtml || body, extraContentHtml].filter(Boolean).join('\n');

        // Combine context data with passed data
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
    }: CardGroupProps): Promise<string> {
        const layoutClassMap: Record<string, string> = {
            stack: 'card-group flex flex-col gap-6',
            grid: 'card-group grid grid-cols-1 sm:grid-cols-2 gap-6',
            flex: 'card-group flex flex-wrap gap-6',
        };

        const wrapperClass = `${layoutClassMap[layout]} ${className}`;

        // Combine context data with passed data
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

    async getHtml(): Promise<string> {
        return this.render(`<div class="">No content</div>`, this.contextData);
    }
}
