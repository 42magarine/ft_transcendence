import { HeadingProps } from '../../interfaces/componentInterfaces.js';

export default class HeadingBlock {
    static async renderHeading({ level = 2, text, className = 'text-xl font-bold text-white' }: HeadingProps): Promise<string> {
        return `<h${level} class="${className}">${text}</h${level}>`;
    }
}
