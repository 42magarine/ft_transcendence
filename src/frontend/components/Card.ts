import { InputField, CardButton, CardProps, CardGroupProps, ContentBlock, ToolbarProps } from '../../interfaces/abstractViewInterfaces.js';
import AbstractView from '../../utils/AbstractView.js';
import Table from './Table.js';
import Input from './Input.js'

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
                const Input = (await import('./Input.js')).default;
                return await new Input().renderInput(block.props);
            }

            case 'label': {
                const Label = (await import('./Label.js')).default;
                return await new Label().renderLabel(block.props);
            }

            case 'stat': {
                const Stat = (await import('./Stat.js')).default;
                return await new Stat().renderStat(block.props);
            }

            case 'toggle': {
                const Toggle = (await import('./Toggle.js')).default;
                return await new Toggle().renderToggle(block.props);
            }

            case 'toolbar': {
                const Toolbar = (await import('./Toolbar.js')).default;
                return await new Toolbar().renderBlock(block.props);
            }

            case 'table': {
                const Table = (await import('./Table.js')).default;
                return await new Table().renderTable(block.props);
            }

            case 'matchup': {
                const player1Html = await this.renderContentBlock(block.props.player1);
                const player2Html = await this.renderContentBlock(block.props.player2);
                return `
            <div class="lobby-center text-center">
                ${player1Html}
                <div class="vs my-2 font-bold text-lg">VS</div>
                ${player2Html}
            </div>`;
            }

            case 'actions': {
                return `<div class="lobby-actions mt-4">${block.props.buttons}</div>`;
            }

            case 'inputgroup': {
                const Input = (await import('./Input.js')).default;
                const inputHtmls = await Promise.all(
                    block.props.inputs.map(async (input) => new Input().renderInput(input))
                );
                return inputHtmls.join('\n');
            }

            case 'button': {
                const Button = (await import('./Button.js')).default;
                return await new Button().renderButton(block.props);
            }

            case 'buttongroup': {
                const Button = (await import('./Button.js')).default;
                return await new Button().renderGroup(block.props);
            }

            case 'html': {
                return block.props.html;
            }

            case 'twofactor': {
                const Input = (await import('./Input.js')).default;
                const tfInputs = await new Input().renderNumericGroup(6, 'tf');
                return `
            <div id="twoFactorInterface">
                <div id="qr-display" class="mb-4"></div>
                <input type="hidden" id="secret" name="secret" />
                ${tfInputs}
            </div>`;
            }

            case 'signup-footer': {
                return `
            <p>Already have an account? <a router href="/login">log in</a></p>
            <div class="flex justify-center pt-2">
                <button id="google-signup" class="btn btn-google">Sign up with Google</button>
            </div>`;
            }

            case 'separator': {
                const Separator = (await import('./Seperator.js')).default;
                return await Separator.render(block.props);
            }

            case 'heading': {
                const Heading = (await import('./Heading.js')).default;
                return await Heading.render(block.props);
            }

            case 'paragraph': {
                const Paragraph = (await import('./Paragraph.js')).default;
                return await Paragraph.render(block.props);
            }

            case 'container': {
                const Container = (await import('./Container.js')).default;
                return await Container.render(block.props);
            }

            default:
                return '';
        }
    }

    async renderCard(
        {
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

        const inputBlocks = inputs.map(input => (
            {
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
            buttonGroupHtml = await btn.renderGroup(
                {
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


        const bodyContent = [formHtml /*, tableHtml if needed */].filter(Boolean).join('\n');

        const mergedData = { ...this.contextData, ...data };

        const positionClassMap: Record<string, string> =
        {
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

    async renderGroup(
        {
            cards,
            layout = 'grid',
            className = 'card',
            data = {},
        }: CardGroupProps): Promise<string> {
        const layoutClassMap: Record<string, string> =
        {
            stack: 'card-group flex flex-col gap-6',
            grid: 'card-group grid grid-cols-1 sm:grid-cols-2 gap-6',
            flex: 'card-group flex flex-wrap gap-6',
        };

        const wrapperClass = `${layoutClassMap[layout]} ${className}`;
        const mergedData = { ...this.contextData, ...data };

        const renderedCards = await Promise.all(
            cards.map(config => this.renderCard(
                {
                    ...config,
                    data: mergedData,
                }))
        );

        return this.render(`
            <div class="${wrapperClass}">
                ${renderedCards.join('\n')}
            </div>`, mergedData);
    }

    async getHtml(): Promise<string> {
        return this.render(`<div class="">No content</div>`, this.contextData);
    }
}
