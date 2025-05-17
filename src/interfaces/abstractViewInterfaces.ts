//BUTTON.TS

export interface ButtonProps {
    id: string;
    text: string;
    className?: string;
    type?: 'submit' | 'button';
    onClick?: string;
    href?: string;
    status?: 'ready' | 'waiting' | 'unavailable';
}

export interface ButtonGroupProps {
    buttons: ButtonProps[];
    align?: 'left' | 'center' | 'right';
    layout?: 'group' | 'stack' | 'grid' | 'flex';
    className?: String;
    columns?: number;
}

//CARD.TS

export interface InputField {
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

export interface CardButton {
    text: string;
    type: string;
    className?: string;
}

export interface CardProps {
    title?: string;
    footer?: string;
    className?: string;
    body?: string;
    inputs?: InputField[];
    button?: CardButton;
    formId?: string;
    extra?: string;
    prefix?: string;
    preButton?: string;
    contentBlocks?: ContentBlock[];
    data?: Record<string, any>;
}

export interface CardGroupProps {
    cards: CardProps[];
    layout?: 'stack' | 'grid' | 'flex';
    className?: string;
    data?: Record<string, any>;
}

export type ContentBlock =
    | { type: 'input'; props: InputField }
    | { type: 'label'; props: { htmlFor: string; text: string } }
    | { type: 'stat'; props: { label: string; value: string } }
    | { type: 'toggle'; props: { name: string; checked?: boolean; label?: string } }
    | { type: 'toolbar'; props: { buttons: { text: string; onClick: string }[] } };

//INPUT.TS

export interface InputProps {
    id?: string;
    name: string;
    type?: string;
    placeholder?: string;
    value?: string;
    className?: string; // optional override
}

//LABEL.TS

export interface LabelProps {
    htmlFor: string;
    text: string;
    className?: string;
}

//STATS.TS

export interface StatProps {
    label: string;
    value: string | number;
    className?: string;
}

//TITLE.TS

export interface TitleProps {
    title: string;
    subtitle?: string;
}

//TOGGLE.TS

export interface ToggleProps {
    id: string;
    label: string;
    checked?: boolean;
}
