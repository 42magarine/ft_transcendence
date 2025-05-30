// BUTTON.TS

export type ButtonAlign = 'left' | 'center' | 'right';
export type ButtonStatus = 'ready' | 'waiting' | 'unavailable';
export type ButtonType = 'submit' | 'button' | 'google-signin' | 'text-with-button';

export interface ButtonProps {
    id?: string;            // ID attribute of the button element
    text?: string;          // Visible text on the button
    className?: string;     // Additional Tailwind/CSS classes for styling
    textBefore?: string;    // Optional text shown before the button (used in 'text-with-button')
    onClick?: string;       // JavaScript function or expression to run on click
    href?: string;          // If provided, renders the button as a link
    iconHtml?: string;      // Raw HTML string for an icon (e.g., from FontAwesome)
    align?: 'left' | 'center' | 'right';                    // Button alignment inside its container
    status?: 'ready' | 'waiting' | 'unavailable'; // Optional status for colored state-based styling
    type?: 'submit' | 'button' | 'google-signin' | 'text-with-button';              // Type of button
    dataAttributes?: any;
}

export interface ButtonGroupProps {
    align?: 'center' | 'left' | 'right';    // Alignment of the entire button group
    layout?: 'stack' | 'grid' | 'group';    // Layout type for arranging buttons
    className?: string;                     // Extra classes for the container
    columns?: number;                       // Used for grid layout (e.g., grid-cols-2)
    buttons?: ButtonProps[];                // List of individual buttons to render
    toggles?: ToggleProps[];                // Optional toggle switches to include in the group
    inputs?: InputProps[];                  // Optional inline inputs (e.g., name/email fields)
}

// CARD.TS
export interface InputField {
    id?: string;
    name: string;           // Name attribute of the input
    placeholder?: string;   // Placeholder text
    value?: string;         // Initial value
    options?: Array<{ value: string, label: string }>; // For select dropdowns
    min?: number;              // Minimum value for number inputs
    max?: number;           // Maximum value for number inputs
    step?: number;          // Step size for number inputs
    className?: string;     // Additional styling classes
    withConfirm?: boolean;  // Whether to render a confirm field (e.g., confirm password)
    label?: string; 
    type?:                  // Input type
    'text'
    | 'email'
    | 'password'
    | 'select'
    | 'hidden'
    | 'display'
    | 'file'
    | 'checkbox'
    | 'number';
}

export interface CardButton {
    text: string;       // Button text
    type: string;       // Button type (usually 'submit' or 'button')
    className?: string; // Button CSS classes
}

export interface CardProps {
    title?: string;                     // Card header title
    footer?: string;                    // Optional footer content
    className?: string;                 // Card wrapper class
    body?: string;                      // Optional static body HTML
    inputs?: InputField[];              // List of inline inputs
    button?: CardButton;                // Optional standalone button
    buttonGroup?: ButtonProps[];        // List of buttons to show in a group
    formId?: string;                    // Optional form wrapper ID
    extra?: string;                     // Extra custom HTML or components
    prefix?: string;                    // Content shown above all blocks
    preButton?: string;                 // Content shown just above the main button
    contentBlocks?: ContentBlock[];     // Array of structured content blocks inside the card
    data?: Record<string, any>;         // Optional dynamic data context
    table?: TableProps;                 // Optional table to render inside the card
    position?:                          // Card alignment on screen
    'center'
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
    cards: CardProps[];                 // Array of card definitions to render in a group
    layout?: 'stack' | 'grid' | 'flex'; // Layout strategy for displaying cards
    className?: string;                 // CSS class for the group container
    data?: Record<string, any>;         // Shared data context for all cards
}

export type ContentBlock =
    | { type: 'input'; props: InputField } // Renders an input field
    | { type: 'label'; props: { htmlFor: string; text: string } } // Renders a form label
    | { type: 'stat'; props: StatProps } // Renders a stat display
    | { type: 'toggle'; props: ToggleProps } // Renders a toggle switch
    | { type: 'toolbar'; props: { buttons: { text: string; onClick: string }[] } } // Renders a button toolbar
    | { type: 'table'; props: TableProps } // Renders a dynamic data table
    | { type: 'matchup'; props: { player1: ContentBlock; player2: ContentBlock } } // Renders a matchup block with 2 child content blocks
    | { type: 'inputgroup'; props: { inputs: InputField[] } } // Renders a group of input fields inline
    | { type: 'buttongroup'; props: ButtonGroupProps & { toggles?: ToggleProps[] } } // Renders a button group with optional toggles
    | { type: 'button'; props: ButtonProps } // Renders a standalone button
    | { type: 'html'; props: { html: string } } // Renders raw HTML
    | { type: 'separator'; props?: { className?: string } }
    | { type: 'heading'; props: HeadingProps }
    | { type: 'paragraph'; props: ParagraphProps }
    | { type: 'container'; props: ContainerProps }
    | { type: 'twofactor'; props: { length?: number; namePrefix?: string } } // Renders 2FA code inputs
    | { type: 'signup-footer'; props?: {} }; // Renders login link + Google signup button

// INPUT.TS
export interface InputProps {
    id?: string;            // Input ID
    name: string;           // Input name
    type?: string;          // HTML input type
    placeholder?: string;   // Placeholder value
    value?: string;         // Default value
    className?: string;     // Custom classes
    label?: string;
    withConfirm?: boolean;  // Whether to show a confirmation field
}

// LABEL.TS
export interface LabelProps {
    htmlFor: string;    // ID of the element this label describes
    text: string;       // Visible label text
    className?: string; // Additional styling
}

// STATS.TS
export interface StatProps {
    label: string;          // Label text for the stat (e.g. "XP", "Score")
    value: string | number; // Stat value
    className?: string;     // Optional styling
}

// TITLE.TS
export interface TitleProps {
    title: string;      // Main title
    subtitle?: string;  // Optional subtitle
}

// TOGGLE.TS
export interface ToggleProps {
    id: string;             // Toggle ID
    name: string;           // Toggle name
    label: string;          // Toggle label shown to user
    checked: boolean;       // Whether toggle is initially on
    readonly?: boolean;     // If true, toggle cannot be changed
}

// TABLE.TS
// In abstractViewInterfaces.ts
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

// MODAL.TS
export interface ModalProps {
    id: string;                             // Modal ID
    title?: string;                         // Modal title/header
    content: string;                        // HTML string for modal body content
    footer?: string;                        // Optional static footer HTML
    footerButtons?: ButtonProps[];          // Array of buttons to show in footer
    showCloseButton?: boolean;              // Whether to render a close "X" button
    animation?: 'fade' | 'scale' | 'none';  // Animation style
    closableOnOutsideClick?: boolean;       // Whether clicking outside closes the modal
}

export interface ParagraphProps {
    html: string;
    align?: 'left' | 'center' | 'right';
    className?: string;
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

export interface ContainerProps {
    html: string;
    className?: string;
}

// Toolbar.ts
interface ToolbarButton {
    text: string;
    onClick?: string;  // Optional inline handler or ID
    id?: string;
    className?: string;
}

export interface ToolbarProps {
    buttons: ToolbarButton[];
    className?: string;
}

// matchup props

export interface MatchupProps
{
	player1: ContentBlock;
	player2: ContentBlock;
}