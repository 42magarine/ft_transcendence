// components/cardblocks/SeparatorBlock.ts
export default class Separator {
	static async renderSeparator({
		className = 'mt-6 mb-4 border-b border-gray-900'
	}: { className?: string }): Promise<string> {
		return `<hr class="${className}" />`;
	}
}
