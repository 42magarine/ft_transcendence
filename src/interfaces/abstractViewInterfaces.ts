//BUTTON.TS

export interface ButtonProps {
    id?: string;
    text?: string;
    className?: string;
    type?: 'submit' | 'button' | 'google-signin'| 'text-with-button';
    textBefore?: string;
    onClick?: string;
    href?: string;
    status?: 'ready' | 'waiting' | 'unavailable';
    iconHtml?: string;
    align?: 'left' | 'center' | 'right';
}

export interface ButtonGroupProps {
	align?: 'center' | 'left' | 'right';
	layout?: 'stack' | 'grid' | 'group';
	className?: string;
	columns?: number;
	buttons?: ButtonProps[];
	toggles?: ToggleProps[];  // FIX: previously was `string[]`
	inputs?: InputProps[];    // for inline name/email/password etc.
}

//CARD.TS

export interface InputField {
    name: string;
    type?: 'text' | 'email' | 'password' | 'select' | 'hidden' | 'display' | 'file' | 'checkbox' | 'number';
    placeholder?: string;
    value?: string;
    options?: Array<{ value: string, label: string }>; // For select inputs
    min?: number;         // For number inputs
    max?: number;         // For number inputs
    step?: number;        // For number inputs
    className?: string;   // Added className for custom styling
    withConfirm?: boolean;
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
    buttonGroup?: ButtonProps[];
    formId?: string;
    extra?: string;
    prefix?: string;
    preButton?: string;
    contentBlocks?: ContentBlock[];
    data?: Record<string, any>;
    table?: TableProps;
    position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
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
    | { type: 'toggle'; props: ToggleProps }
    | { type: 'toolbar'; props: { buttons: { text: string; onClick: string }[] } }
    | { type: 'matchup'; props: { player1: string; player2: string } }
    | { type: 'actions'; props: { buttons: string } }
    | { type: 'inputgroup'; props: { inputs: InputField[] } }
    | { type: 'buttongroup'; props: ButtonGroupProps & { toggles?: ToggleProps[] } }
    | { type: 'html'; props: { html: string } };


//INPUT.TS

export interface InputProps {
	id?: string;
	name: string;
	type?: string;
	placeholder?: string;
	value?: string;
	className?: string;
	withConfirm?: boolean;
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
	name: string;
	label: string;
	checked: boolean;
	readonly?: boolean;
}


//TABLE.TS

export interface TableColumn {
	key: string;
	label: string;
	isAction?: boolean;
	buttons?: (row: any) => ButtonProps[];
    render?: (row: any) => string;
}

export interface TableProps {
	id?: string;
	title?: string;
	height?: string;
	data: any[];
	columns: TableColumn[];
}
