// components/cardblocks/ParagraphBlock.ts
import { ParagraphProps } from '../../interfaces/componentInterfaces.js';

export default class ParagraphBlock {
	static async renderContainer({ html, align = 'left', className = '' }: ParagraphProps): Promise<string> {
		const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : '';
		return `<p class="${[alignClass, className].join(' ').trim()}">${html}</p>`;
	}
}
