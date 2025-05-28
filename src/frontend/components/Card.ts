import AbstractView from '../../utils/AbstractView.js';
import { InputField, CardButton, CardProps, CardGroupProps, ContentBlock } from '../../interfaces/abstractViewInterfaces.js';
import Table from './Table.js';

export default class Card extends AbstractView {
    private contextData: Record<string, any> = {};

    constructor(params: URLSearchParams = new URLSearchParams()) {
        super(params);
    }

    setContextData(data: Record<string, any>): void {
        this.contextData = { ...this.contextData, ...data };
    }

    protected async renderContentBlock(block: ContentBlock): Promise<string> {
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

                if (type === 'select') {
                    return `<select name="${name}" class="p-2 ${className}" required>
                        <option value="" disabled selected>${placeholder}</option>
                        ${options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>`;
                }

                if (type === 'file') {
                    return `<div class="flex flex-col">
                        <label for="${name}" class="text-sm font-medium text-white/90">${placeholder}</label>
                        <input type="file" id="${name}" name="${name}" class="file-input file-input-bordered w-full ${className}" />
                    </div>`;
                }
                if (type === 'checkbox') {
                    const Toggle = (await import('./Toggle.js')).default;
                    const toggle = new Toggle();
                    return await toggle.renderToggle({ id: name, name, label: placeholder || '', checked: value === 'true' });
                }

                if (type === 'number') {
                    return `<input type="number" id="${name}" name="${name}" value="${value}" placeholder="${placeholder}"
                        ${min !== undefined ? `min="${min}"` : ''} ${max !== undefined ? `max="${max}"` : ''} ${step !== undefined ? `step="${step}"` : ''}
                        class="${className}" required />`;
                }

                if (type === 'hidden') {
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

                case 'toggle': {
                    const Toggle = (await import('./Toggle.js')).default;
                    const toggle = new Toggle();
                    return await toggle.renderToggle(block.props);
                }

            case 'toolbar':
                return `<div class="flex gap-2">${block.props.buttons
                    .map(btn => `<button onclick="${btn.onClick}" class="btn-sm btn-secondary">${btn.text}</button>`)
                    .join('')}</div>`;

            case 'matchup':
                return `
                    <div class="lobby-center text-center">
                        ${block.props.player1}
                        <div class="vs my-2 font-bold text-lg">VS</div>
                        ${block.props.player2}
                    </div>
                `;
            case 'table':
                return await  new Table().renderTable(block.props);
            case 'actions':
                return `<div class="lobby-actions mt-4">${block.props.buttons}</div>`;

            case 'inputgroup': {
                const { inputs } = block.props;
                const inputHtmls = await Promise.all(inputs.map(async input => this.renderContentBlock({ type: 'input', props: input })));
                return inputHtmls.join('\n');
            }

            case 'button': {
                const Button = (await import('./Button.js')).default;
                const btn = new Button();
                return await btn.renderButton(block.props);
            }

            case 'buttongroup': {
                const Button = (await import('./Button.js')).default;
                const btn = new Button();
                return await btn.renderGroup(block.props);
            }

            case 'html':
                return block.props.html;

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
        buttonGroup,
        formId,
        extra = '',
        prefix = '',
        preButton = '',
        contentBlocks = [],
        data = {},
        table = undefined,
        position = 'center',
    }: CardProps): Promise<string> {
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

        const inputsHtml = await Promise.all(inputBlocks.map(block => this.renderContentBlock(block)));
        const extraContentHtml = await Promise.all(contentBlocks.map(block => this.renderContentBlock(block)));
        const preButtonHtml = preButton ? `<div class="mb-4">${preButton}</div>` : '';
        const prefixHtml = prefix ? `<div class="mb-4">${prefix}</div>` : '';

        let buttonHtml = '';
        if (button) {
            buttonHtml = `<button type="${button.type}" class="${button.className}">${button.text}</button>`;
        }

        let buttonGroupHtml = '';
        if (buttonGroup && buttonGroup.length > 0) {
            const Button = (await import('./Button.js')).default;
            const btn = new Button();
            buttonGroupHtml = await btn.renderGroup({
                buttons: buttonGroup,
                align: 'center',
                layout: 'stack',
                className: 'space-y-2',
            });
        }

        const shouldWrapForm = formId && (inputs.length > 0 || contentBlocks.length > 0 || button || buttonGroupHtml);

        const formHtml = shouldWrapForm
            ? `<form id="${formId}" enctype="multipart/form-data">
                    ${prefixHtml}
                    <div class="flex flex-col gap-4">
                        ${[...inputsHtml, ...extraContentHtml, preButtonHtml, buttonHtml, buttonGroupHtml].join('\n')}
                    </div>
                </form>`
            : [...inputsHtml, ...extraContentHtml, body].join('\n');


        let tableHtml = '';
        if (table) {
            const tableComponent = new Table();
            tableHtml = await tableComponent.renderTable(table);
        }

        const bodyContent = [formHtml, tableHtml].filter(Boolean).join('\n');

        const mergedData = { ...this.contextData, ...data };

        const positionClassMap: Record<string, string> = {
            center: 'items-center justify-center',
            top: 'items-start justify-center',
            bottom: 'items-end justify-center',
            left: 'items-center justify-start',
            right: 'items-center justify-end',
            'top-left': 'items-start justify-start',
            'top-right': 'items-start justify-end',
            'bottom-left': 'items-end justify-start',
            'bottom-right': 'items-end justify-end',
        };
        const positionClass = positionClassMap[position];

        return this.render(`
            <div class="w-full h-full flex ${positionClass}">
                <div class="${className}">
                    ${titleHtml}
                    <div class="card-body px-6 py-4">
                        ${bodyContent}
                    </div>
                    ${footerHtml}
                </div>
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
