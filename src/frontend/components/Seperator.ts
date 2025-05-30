// components/cardblocks/SeparatorBlock.ts
export default class Separator {
	static async renderSeparator({ className = 'my-4 border-t border-gray-300' }: { className?: string }): Promise<string> {
		return `<hr class="${className}" />`;
	}
}

