// components/cardblocks/SeparatorBlock.ts
export default class Separator {
	static async renderSeparator({
		className = 'border-b border-gray-300 my-6'
	}: { className?: string }): Promise<string> {
		return `<hr class="${className}" />`;
	}
}
