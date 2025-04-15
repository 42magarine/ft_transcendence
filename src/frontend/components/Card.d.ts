import AbstractView from '../../utils/AbstractView.js';
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
type ContentBlock = {
    type: 'input';
    props: InputField;
} | {
    type: 'label';
    props: {
        htmlFor: string;
        text: string;
    };
} | {
    type: 'stat';
    props: {
        label: string;
        value: string;
    };
} | {
    type: 'toggle';
    props: {
        name: string;
        checked?: boolean;
        label?: string;
    };
} | {
    type: 'toolbar';
    props: {
        buttons: {
            text: string;
            onClick: string;
        }[];
    };
};
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
    private theme;
    constructor(params?: URLSearchParams);
    private renderContentBlock;
    renderCard({ title, footer, className, body, inputs, button, formId, extra, contentBlocks, theme, }: CardProps): Promise<string>;
    renderGroup({ cards, layout, className, theme, }: CardGroupProps): Promise<string>;
    getHtml(): Promise<string>;
}
export {};
