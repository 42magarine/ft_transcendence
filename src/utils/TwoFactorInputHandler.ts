export default class TwoFactorInputHandler {
    private inputs: HTMLInputElement[];

    constructor(inputSelector: string = '.tf_numeric') {
        this.inputs = Array.from(document.querySelectorAll(inputSelector)) as HTMLInputElement[];
        this.init();
    }

    private init(): void {
        this.inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => this.handleInput(e, index));

            input.addEventListener('keydown', (e) => this.handleKeydown(e, index));

            input.addEventListener('paste', (e) => this.handlePaste(e, index));

            input.addEventListener('focus', (e) => this.handleFocus(e));
        });
    }

    private handleInput(e: Event, index: number): void {
        const input = e.target as HTMLInputElement;
        let value = input.value;

        value = value.replace(/\D/g, '');

        if (value.length > 1) {
            value = value.charAt(0);
        }

        input.value = value;

        if (value && index < this.inputs.length - 1) {
            this.inputs[index + 1].focus();
        }
    }

    private handleKeydown(e: KeyboardEvent, index: number): void {
        const input = e.target as HTMLInputElement;

        if (e.key === 'Backspace') {
            if (!input.value && index > 0) {
                this.inputs[index - 1].focus();
                this.inputs[index - 1].value = '';
            } else if (input.value) {
                input.value = '';
            }
        }

        if (e.key === 'Delete') {
            input.value = '';
        }

        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            this.inputs[index - 1].focus();
        }

        if (e.key === 'ArrowRight' && index < this.inputs.length - 1) {
            e.preventDefault();
            this.inputs[index + 1].focus();
        }

        if (e.key === 'Home') {
            e.preventDefault();
            this.inputs[0].focus();
        }

        if (e.key === 'End') {
            e.preventDefault();
            this.inputs[this.inputs.length - 1].focus();
        }
    }

    private handlePaste(e: ClipboardEvent, index: number): void {
        e.preventDefault();

        const pasteData = e.clipboardData?.getData('text') || '';
        const digits = pasteData.replace(/\D/g, '');

        for (let i = 0; i < digits.length && (index + i) < this.inputs.length; i++) {
            this.inputs[index + i].value = digits.charAt(i);
        }

        const nextEmptyIndex = this.inputs.findIndex((input, i) => i >= index && !input.value);
        const targetIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(index + digits.length, this.inputs.length - 1);

        this.inputs[targetIndex].focus();
    }

    private handleFocus(e: Event): void {
        const input = e.target as HTMLInputElement;
        setTimeout(() => input.select(), 0);
    }

    public getValue(): string {
        return this.inputs.map(input => input.value).join('');
    }

    public setValue(value: string): void {
        const digits = value.replace(/\D/g, '');
        this.inputs.forEach((input, index) => {
            input.value = digits.charAt(index) || '';
        });
    }

    public clear(): void {
        this.inputs.forEach(input => input.value = '');
        this.inputs[0].focus();
    }

    public isComplete(): boolean {
        return this.inputs.every(input => input.value.length > 0);
    }

    public focus(): void {
        const firstEmpty = this.inputs.find(input => !input.value);
        (firstEmpty || this.inputs[0]).focus();
    }
}
