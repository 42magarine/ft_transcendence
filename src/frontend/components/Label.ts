import AbstractView from '../../utils/AbstractView.js';
import { LabelProps } from '../../interfaces/componentInterfaces.js';

export default class Label extends AbstractView {
    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
    }

    async renderLabel({
        htmlFor,
        text = '',
        className = '',
        id,
        iconHtml = '',
        color
    }: LabelProps): Promise<string> {
        console.log(text)
        const labelClass = `mt-2 ${className}`.trim();
        let [labelText, valueText] = String(text).split(':');
        valueText = valueText?.trim() ?? '';

        const hasText = labelText?.trim() !== '';

        const colorClassMap: Record<string, string> = {
            green: 'text-green-500',
            red: 'text-red-500',
            yellow: 'text-yellow-500',
            gray: 'text-gray-500',
            blue: 'text-blue-500',
            black: 'text-black',
            white: 'text-white',
        };

        const icon = iconHtml
            ? `<i class="fas ${iconHtml} ${color && colorClassMap[color] ? colorClassMap[color] : ''}"></i> `
            : '';

        return this.render(`
            <div class="flex flex-row items-center gap-4 ${labelClass}" ${id ? `id="${id}"` : ''}>
                <label for="${htmlFor}" class="text-inherit dark:text-white font-medium leading-normal">
                    ${icon}${hasText ? labelText : ''}
                </label>
                ${hasText ? `<span class="text-inherit dark:text-white leading-normal">${valueText}</span>` : ''}
            </div>
        `);
    }

    async getHtml(): Promise<string> {
        return this.render(`
            <div class="flex flex-row items-center gap-4 mt-2">
                <label for="default" class="text-inherit dark:text-white font-medium leading-normal">Label:</label>
                <span class="text-inherit dark:text-white leading-normal">Value</span>
            </div>
        `);
    }
}
