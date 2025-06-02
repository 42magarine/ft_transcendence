// =========================
// 🎨 BUTTON INTERFACES
// =========================

export type ButtonAlign =
    | 'left'
    | 'center'
    | 'right';

export type ButtonColor =
    | 'primary'
    | 'green'
    | 'yellow'
    | 'red'
    | 'blue'
    | 'gray'
    | 'black'
    | 'white'
    | 'transparent'
    | 'outline';

export type ButtonType = 
    | 'submit'
    | 'delete'
    | 'button'
    | 'google-signin'
    | 'text-with-button';

export interface ButtonProps {
    id?: string;
    text?: string;
    className?: string;
    textBefore?: string;
    onClick?: string;
    href?: string;
    icon?: string;
    align?: ButtonAlign;
    color?: ButtonColor;
    type?: ButtonType;
    dataAttributes?: any;
}

export interface ButtonGroupProps {
    align?: ButtonAlign;
    layout?:
        | 'stack'
        | 'grid'
        | 'group';
    className?: string;
    columns?: number;
    buttons?: ButtonProps[];
    toggles?: ToggleProps[];
    inputs?: InputProps[];
}

// =========================
// 🧾 INPUT INTERFACES
// =========================

export interface InputField {
    id?: string;
    name: string;
    placeholder?: string;
    value?: string;
    options?: Array<{ value: string; label: string }>;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
    withConfirm?: boolean;
    label?: string;
    type?:
        | 'text'
        | 'email'
        | 'password'
        | 'select'
        | 'hidden'
        | 'display'
        | 'file'
        | 'checkbox'
        | 'number';
}

export interface InputProps {
    id?: string;
    name: string;
    type?: string;
    placeholder?: string;
    value?: string;
    className?: string;
    label?: string;
    withConfirm?: boolean;
}

export interface SliderProps {
	id: string;
	label: string;
	min: number;
	max: number;
	step?: number;
	value?: number;
	onInput?: string;
	className?: string;
}

// =========================
// 🗂️ CARD + GROUP INTERFACES
// =========================

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
    buttonGroup?: ButtonProps[];
    formId?: string;
    extra?: string;
    prefix?: string;
    preButton?: string;
    contentBlocks?: ContentBlock[];
    data?: Record<string, any>;
    table?: TableProps;
    position?:
        | 'center'
        | 'top'
        | 'bottom'
        | 'left'
        | 'right'
        | 'top-left'
        | 'top-right'
        | 'bottom-left'
        | 'bottom-right';
}

export interface CardGroupProps {
    cards: CardProps[];
    layout?: 'stack' | 'grid' | 'flex';
    className?: string;
    data?: Record<string, any>;
}

// =========================
// 🧱 CONTENT BLOCKS
// =========================

export type ContentBlock =
    | { type: 'input'; props: InputField }
    | { type: 'label'; props: LabelProps }
    | { type: 'stat'; props: StatProps }
    | { type: 'toggle'; props: ToggleProps }
    | { type: 'toolbar'; props: ToolbarProps }
    | { type: 'table'; props: TableProps }
    | { type: 'matchup'; props: MatchupProps }
    | { type: 'inputgroup'; props: { inputs: InputField[] } }
    | { type: 'buttongroup'; props: ButtonGroupProps & { toggles?: ToggleProps[] } }
    | { type: 'button'; props: ButtonProps }
    | { type: 'slider'; props: SliderProps }
    | { type: 'html'; props: { html: string } }
    | { type: 'separator'; props?: { className?: string } }
    | { type: 'heading'; props: HeadingProps }
    | { type: 'paragraph'; props: ParagraphProps }
    | { type: 'container'; props: ContainerProps }
    | { type: 'twofactor'; props: { length?: number; namePrefix?: string } }
    | { type: 'signup-footer'; props?: {} };

// =========================
// 📋 FORM / LABEL / TOGGLE
// =========================

export interface LabelProps {
    htmlFor: string;
    text?: string;
    id?: string;
    className?: string;
    iconHtml?: string;
    color?: 'green' | 'red' | 'gray' | 'yellow' | string; 
}

export interface ToggleProps {
    id?: string;
    name: string;
    label: string;
    checked: boolean;
    readonly?: boolean;
}

// =========================
// 📊 TABLE + STATS
// =========================

export interface TableColumn {
    key: string;
    label: string;
    colspan?: number;
}

export interface TableProps {
    id: string;
    title?: string;
    height?: string;
    data: any[];
    rowLayout: (row: any) => ContentBlock[];
    columns?: TableColumn[];
}

export interface StatProps {
    label: string;
    value: string | number;
    className?: string;
}

// =========================
// 🧾 TEXT / TYPOGRAPHY
// =========================

export interface TitleProps {
    title: string;      // Main title
    subtitle?: string;  // Optional subtitle
}

export interface HeadingProps {
    level?: 1 | 2 | 3 | 4;
    text: string;
    className?: string;
}

export interface ParagraphProps {
    html: string;
    align?: 'left' | 'center' | 'right';
    className?: string;
}

// =========================
// 📦 CONTAINERS / SPECIALS
// =========================

export interface ContainerProps {
    html: string;
    className?: string;
}

export interface MatchupProps {
    player1: ContentBlock;
    player2: ContentBlock;
}

// =========================
// 🪟 MODAL INTERFACE
// =========================

export interface ModalProps {
    id: string;
    title?: string;
    content: string;
    footer?: string;
    footerButtons?: ButtonProps[];
    showCloseButton?: boolean;
    closableOnOutsideClick?: boolean;
}

// =========================
// 🔧 TOOLBAR INTERFACE
// =========================

interface ToolbarButton {
    text: string;
    onClick?: string;
    id?: string;
    className?: string;
}

export interface ToolbarProps {
    buttons: ToolbarButton[];
    className?: string;
}
